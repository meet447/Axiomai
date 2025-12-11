# Axiomai

Axiomai is a powerful, open-source AI research assistant and agentic platform. It provides a modern web interface for deep research, expert search, clarification loops, and more.

## Project Structure

- **web/**: The main web application (renamed from frontend) built with Next.js 14, React, TailwindCSS, and ShadCN UI. Contains all agentic logic, search scrapers, and UI components.

## Getting Started

### Prerequisites

- Node.js 18+
- API Keys (OpenAI compatible)

### Setup & Running

1. **Navigate to the web directory:**

    ```bash
    cd web
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure Environment:**
    Copy the example environment file and fill in your keys:

    ```bash
    cp .env.example .env
    ```

    - Set `LLM_API_KEY` (e.g., OpenAI, Groq, Ollama).
    - Set `SEARCH_PROVIDER` (optional, defaults to `google-scraper` which is free).

4. **Run Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Deep Research / Expert Mode:** Iterative planning and multi-step research.
- **Clarification Loop:** The agent asks clarifying questions for ambiguous queries.
- **Focus Modes:** Switch between Web, Academic, Video, and Social search contexts.
- **Pro Mode:** Advanced reasoning steps.
- **Fully Client-Side Logic:** No external backend required; runs entirely via Next.js API routes.
