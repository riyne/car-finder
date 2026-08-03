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
alias carfinder="/Users/ryanyap/repos/car-finder/start"
\`\`\`

Then run `source ~/.zshrc` and make sure the script is executable:

\`\`\`bash
chmod +x start
\`\`\`

Press `Ctrl+C` in the terminal to stop both servers cleanly.