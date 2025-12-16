import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  summary: string | null;
  entry_type: "regular" | "chat";
  chat_history: ChatMessage[] | null;
  created_at: string;
  updated_at: string;
};
