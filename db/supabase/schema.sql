-- Run this in Supabase → SQL Editor → New query

-- ── 1. Profiles table ──────────────────────────────────────────────────────
-- Extends auth.users with display name and plan tier.
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  plan      TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Prompts history table ───────────────────────────────────────────────
-- Stores every polished prompt for a user.
CREATE TABLE IF NOT EXISTS prompts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original     TEXT NOT NULL,
  polished     TEXT NOT NULL,
  mode         TEXT DEFAULT 'basic' CHECK (mode IN ('basic', 'ai')),
  improvements JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Users can read their own prompts (client-side queries)
CREATE POLICY "Users can read own prompts" ON prompts
  FOR SELECT USING (auth.uid() = user_id);

-- The backend uses the service_role key which bypasses RLS for inserts
