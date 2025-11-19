# ExpenSavvy - Gemini Expense Manager

This is a comprehensive Expense Management Application leveraging Gemini for OCR-based data extraction, featuring role-based access, budget management, and a customizable email notification system.

## Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Application (Frontend + Backend):**
    ```bash
    npm run dev
    ```
    -   Frontend: http://localhost:5173
    -   Backend API: http://localhost:5000

## Data Source Configuration

The application is designed to run in two data source modes: **Demo Mode** and **Real Database Mode**. You can switch between these modes using the toggle on the login screen. This selection determines which API service file is used to fetch and manipulate data.

### 1. Demo Mode (Mock API)

This is the default mode and is designed for frontend development and demonstration purposes without needing a backend.

-   **Service File:** `services/apiService.mock.ts`
-   **How it Works:** This service uses a pre-defined set of data imported from `constants.ts`. All data operations (adding, updating, deleting) manipulate this in-memory data.
-   **Behavior:**
    -   No external database or backend server is required.
    -   The application is fully functional from a UI perspective.
    -   All data will be reset to its initial state when you refresh the page.
    -   API calls are simulated with a slight delay to mimic real network latency.
-   **Configuration:** No configuration is needed. Simply select "Demo Data" on the login screen.

### 2. Real Database Mode (Backend Integration)

To use the "Real Database" mode, you must have PostgreSQL running.

#### Backend Setup Instructions

1.  **Prerequisites:**
    -   Ensure you have Node.js installed.
    -   Ensure you have PostgreSQL installed and running.

2.  **Database Setup:**
    -   Use the `postgres_setup.txt` script to create your database and tables.
    -   Ensure your PostgreSQL user matches the configuration in `server.js` (Default: user `postgres`, password `password`). You can set environment variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` to override defaults.

3.  **Connect Frontend:**
    -   Run `npm run dev`
    -   On the Login screen, select **Real Database**.
    -   Login with one of the seeded users (e.g., `alice@example.com` / `password123`).

**Note:** The frontend expects the backend to be running on port 5000. If you change this, update `API_BASE_URL` in `services/apiService.real.ts`.