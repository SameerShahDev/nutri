-- Supabase Database Updates
-- Run this in Supabase SQL Editor to apply new changes
-- All commands are idempotent (safe to run multiple times)

-- Add calorie_goal column to profiles table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='calorie_goal') THEN
    ALTER TABLE profiles ADD COLUMN calorie_goal INTEGER DEFAULT 2000;
  END IF;
END $$;

-- Update subscription_plan check constraint to match new plans
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_plan_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_subscription_plan_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check 
    CHECK (subscription_plan IN ('free', 'starter', 'pro', 'elite'));
END $$;

-- Create fasting_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  target_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for fasting_sessions if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'fasting_sessions' AND rowsecurity = true
  ) THEN
    ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for fasting_sessions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fasting_sessions' AND policyname = 'Users can view own fasting sessions'
  ) THEN
    CREATE POLICY "Users can view own fasting sessions" ON fasting_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fasting_sessions' AND policyname = 'Users can insert own fasting sessions'
  ) THEN
    CREATE POLICY "Users can insert own fasting sessions" ON fasting_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fasting_sessions' AND policyname = 'Users can update own fasting sessions'
  ) THEN
    CREATE POLICY "Users can update own fasting sessions" ON fasting_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index for fasting_sessions if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user_id ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_is_active ON fasting_sessions(is_active);

-- Enable Realtime for daily_logs if table exists and not already enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'daily_logs'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_logs;
  END IF;
END $$;
