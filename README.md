
# Smart Finance AI

A futuristic, AI-powered financial dashboard built with React, Tailwind, and Supabase.

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Supabase Config (Required for Data Persistence)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (Required for AI Features)
API_KEY=your-google-gemini-api-key
```

> **Note:** For AI features, this app uses `@google/genai`. The API key is exposed in the client bundle. For production apps, proxy this request through a backend.

### 2. Database Setup (Supabase)

This application is a **Full-Stack SaaS** that relies on a robust database structure.

1.  Create a new project on [Supabase](https://supabase.com).
2.  Navigate to the **SQL Editor** in your Supabase dashboard.
3.  **Run Schema Script:** Copy the content of `supabase/schema.sql` and run it. This creates all necessary tables and Row Level Security (RLS) policies.
4.  **Run Functions Script:** Copy the content of `supabase/functions.sql` and run it. This creates the Stored Procedures (RPCs) required for the application logic.
5.  **Run Performance Fixes:** Copy the content of `supabase/fix_rls_performance.sql` and run it. This optimizes RLS policies and removes duplicate rules.
6.  Enable Email Auth in Supabase Authentication settings.

### 3. Running the App

```bash
npm install
npm run dev
```

## 🏗️ Architecture

*   **Frontend:** React 18, Zustand (State), React Query (Data Fetching), Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL + Auth + Storage).
*   **AI:** Google Gemini 2.5 Flash (via `@google/genai` SDK).

## 🛡️ Security Notes

*   **RLS:** All tables have RLS enabled. Users can only access data linked to their `company_id` via `user_company_roles`.
*   **Transactions:** Financial transactions use Postgres Functions (`rpc`) to ensure ACID compliance (e.g., creating an invoice decrementing inventory atomically).
