# Journal — Think Better

LLM-powered journaling. (I built this for a friend)

## Features

- **Modern, minimal UI** — Clean white design with elegant typography
- **AI-powered prompts** — Get thoughtful reflection prompts based on your previous entries
- **Interactive suggestions** — Receive therapeutic guidance as you write each paragraph
- **Mood tracking** — Track your emotional state with each entry
- **Secure authentication** — User accounts powered by Stack Auth
- **Entry history** — Browse and edit your past journal entries

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Stack Auth
- **Database**: Supabase (PostgreSQL)
- **LLM**: OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS

## Setup

### 1. Database Setup

Run the following SQL in your Supabase SQL Editor to create the required table:

```sql
-- See lib/schema.sql for the complete schema
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON journal_entries(created_at DESC);
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_client_key
STACK_SECRET_SERVER_KEY=your_server_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

The app is designed to be deployed on Vercel. Simply connect your repository to Vercel and add the environment variables in your project settings.

## License

MIT
