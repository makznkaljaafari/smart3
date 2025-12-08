
# Contributing to Smart Finance AI

Welcome to the Smart Finance AI project! We're building the future of financial management for SMEs.

## 🛠️ Tech Stack

-   **Framework:** React 18 (Vite)
-   **Language:** TypeScript
-   **State Management:** Zustand
-   **Data Fetching:** TanStack Query (React Query)
-   **Styling:** Tailwind CSS
-   **Backend:** Supabase (PostgreSQL + RLS)
-   **AI:** Google Gemini API

## 🚀 Getting Started

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/your-repo/smart-finance-ai.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your Supabase and Gemini API keys.
    ```
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    API_KEY=...
    ```
4.  **Run locally:**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

We follow a **Feature-based Architecture**:

```
src/
  features/       # Domain-specific code (components, hooks, types)
    customers/
    invoices/
    dashboard/
  components/     # Shared UI components (Button, Modal, Input)
  services/       # API calls & Business Logic (adapters)
  store/          # Global State (Zustand)
  lib/            # Utilities & Helpers
  types/          # Global TS Interfaces
```

## 🧪 Testing

We use **Vitest** for unit and integration tests.

-   Run tests: `npm test`
-   Run tests with UI: `npm test -- --ui`

**Rules:**
1.  Write tests for all utility functions in `lib/`.
2.  Write integration tests for critical hooks in `features/*/hooks/`.

## 🎨 Styling Guidelines

-   Use Tailwind utility classes.
-   Use CSS variables defined in `index.html` for theming (e.g., `bg-[rgb(var(--bg-primary-rgb))]`).
-   Ensure Dark/Light mode compatibility for all new components.

## 🔒 Security Checklist

-   [ ] Verify Row Level Security (RLS) policies for new tables.
-   [ ] Do not expose sensitive keys in client-side code (except allowed anon keys).
-   [ ] Validate all inputs.

Thank you for contributing!
