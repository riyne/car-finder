## How it works

Car Finder tracks used inventory at four Audi dealerships (Richmond, Capilano, OpenRoad, and Downtown Vancouver) and shows what changed since the last check. Requesting a dealer (`GET /cars/{dealer_key}`) makes the FastAPI backend open that dealer's used-inventory page in headless Chrome with Selenium and keep clicking "Load more vehicles" until the full list is loaded. It then extracts each car's stock number, year, brand, model, and listing link. That list is compared with the snapshot saved by the previous run (`data/current_stock_<dealer>.csv`): cars are matched by stock number, so a stock number missing from the old snapshot is reported as new, and one missing from the new list is reported as removed. The new list then overwrites the snapshot, and the API returns the total count plus the new and removed lists, which the React (Vite) frontend displays.

Dealer keys: `audi-richmond`, `audi-capilano`, `openroad-audi`, `audi-downtown-vancouver`.

**Limitations:** it tracks listings appearing and disappearing, not price changes. There is one snapshot per dealer, so each run is compared only with the previous run (the first run reports every car as new). The scraper also depends on the dealers' current page markup.

## Running the project locally

From anywhere in Terminal, run:

\`\`\`bash
carfinder
\`\`\`

This starts the backend (FastAPI/uvicorn), the frontend (Vite dev server), and opens
the app in Chrome automatically.

`carfinder` is a shell alias pointing to the `start` script in the project root.
If it's not set up on your machine, add this line to your `~/.zshrc`:

\`\`\`bash
alias carfinder="/path/to/car-finder/start"
\`\`\`

Then run `source ~/.zshrc` and make sure the script is executable:

\`\`\`bash
chmod +x start
\`\`\`

Press `Ctrl+C` in the terminal to stop both servers cleanly.
