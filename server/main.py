import time
import csv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from pathlib import Path

# source .venv/bin/activate
# uvicorn main:app --reload    

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEALER_URLS = {
    "audi-richmond": "https://www.audirichmond.com/en/inventory/used/",
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CURRENT_STOCK_CSV = DATA_DIR / "current_stock.csv"


def click_load_more_vehicles(driver: webdriver.Chrome, timeout: int = 20) -> None:
    button_xpath = "//button[normalize-space()='Load more vehicles']"

    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(5)

        buttons = driver.find_elements(By.XPATH, button_xpath)
        if not buttons:
            print("No Load more vehicles button found; stopping.")
            break

        print("Clicking Load more vehicles.")
        buttons[0].click()
        time.sleep(3)


def parse_title(title: str) -> dict:
    parts = [part for part in title.strip().split(" ") if part]

    if len(parts) < 3:
        return {"year": "", "brand": "", "model": title.strip()}

    year = parts[0]
    brand = parts[1]
    model = " ".join(parts[2:])

    return {"year": year, "brand": brand, "model": model}


def extract_inventory_rows(driver: webdriver.Chrome) -> list[dict]:
    rows = driver.execute_script(
        """
        const stockElements = Array.from(document.querySelectorAll('p[data-testid="stock-number"]'));
        return stockElements.map((stockElement) => {
          const card = stockElement.closest('article') || stockElement.closest('li') || stockElement.parentElement;
          const titleElement = card ? card.querySelector('h3') : null;
          return {
            stockNumber: (stockElement.textContent || '').trim(),
            title: (titleElement && titleElement.textContent ? titleElement.textContent : '').trim(),
          };
        });
        """
    )

    inventory_rows: list[dict] = []
    seen_stock_numbers: set[str] = set()

    for row in rows:
        stock_number_text = (row.get("stockNumber") or "").strip()
        title = (row.get("title") or "").strip()

        stock_number = stock_number_text.lower().split("Stock #: ")[-1].strip(" :")

        if not stock_number or stock_number in seen_stock_numbers:
            continue

        parsed_title = parse_title(title)
        inventory_rows.append(
            {
                "stock number": stock_number,
                "year": parsed_title["year"],
                "brand": parsed_title["brand"],
                "model": parsed_title["model"],
            }
        )
        seen_stock_numbers.add(stock_number)

    return inventory_rows


def dump_page_state(driver: webdriver.Chrome) -> None:
    page_title = driver.title
    current_url = driver.current_url
    body_html = driver.find_element(By.TAG_NAME, "body").get_attribute("innerHTML")

    project_dir = Path(__file__).resolve().parent
    debug_dir = project_dir / "debug"
    debug_dir.mkdir(exist_ok=True)

    screenshot_path = debug_dir / "audi-richmond-page.png"
    html_path = debug_dir / "audi-richmond-page.html"

    html_path.write_text(body_html, encoding="utf-8")
    driver.save_screenshot(str(screenshot_path))

    print("--- PAGE STATE ---")
    print(f"URL: {current_url}")
    print(f"Title: {page_title}")
    print(f"Saved body HTML: {html_path}")
    print(f"Screenshot: {screenshot_path}")
    print("--- END PAGE STATE ---")


@app.get("/cars/{dealer_key}")
def get_cars(dealer_key: str):
    url = DEALER_URLS.get(dealer_key)
    if url is None:
        raise HTTPException(status_code=404, detail="Unknown dealer")

    options = Options()
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    )
    options.add_argument("--disable-blink-features=AutomationControlled")

    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        dump_page_state(driver)
        click_load_more_vehicles(driver)

        inventory_rows = extract_inventory_rows(driver)

        DATA_DIR.mkdir(exist_ok=True)
        with CURRENT_STOCK_CSV.open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=["stock number", "year", "brand", "model"])
            writer.writeheader()
            writer.writerows(inventory_rows)

        print(f"Total cars found: {len(inventory_rows)}")
        for row in inventory_rows:
            print(row)

        return {"dealer": dealer_key, "count": len(inventory_rows), "csv_path": str(CURRENT_STOCK_CSV), "cars": inventory_rows}
    finally:
        driver.quit()