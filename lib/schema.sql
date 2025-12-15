-- Run this SQL in your Supabase SQL Editor to create the journal_entries table

-- journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON journal_entries(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own entries
CREATE POLICY "Users can view own entries" ON journal_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own entries" ON journal_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

