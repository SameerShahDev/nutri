-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  age INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  calorie_goal INTEGER DEFAULT 2000,
  water_goal INTEGER DEFAULT 2000,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'elite')),
  dark_mode BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create meals table
CREATE TABLE meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fats DECIMAL(5,2),
  meal_date DATE NOT NULL,
  meal_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create nutrition_goals table
CREATE TABLE nutrition_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  daily_calories INTEGER DEFAULT 2000,
  daily_protein DECIMAL(5,2) DEFAULT 150,
  daily_carbs DECIMAL(5,2) DEFAULT 250,
  daily_fats DECIMAL(5,2) DEFAULT 65,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create daily_logs table
CREATE TABLE daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  macros JSONB,
  water_intake INTEGER DEFAULT 0,
  type TEXT DEFAULT 'manual' CHECK (type IN ('manual', 'ai')),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create usage_limits table
CREATE TABLE usage_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Create orders table for payment tracking
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('99', '299', '499', '999')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_session_id TEXT,
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subscriptions table for recurring payment tracking
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('499', '999')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  subscription_link_id TEXT,
  next_billing_date DATE,
  cashfree_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create body_reports table for body analysis tracking
CREATE TABLE body_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  age INTEGER NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  goal TEXT,
  tdee INTEGER,
  recommended_water INTEGER,
  protein_target DECIMAL(5,2),
  exercises JSONB,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_date ON meals(meal_date);
CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_daily_logs_type ON daily_logs(type);
CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX idx_usage_limits_date ON usage_limits(date);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_body_reports_user_id ON body_reports(user_id);
CREATE INDEX idx_body_reports_date ON body_reports(analysis_date);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own goals" ON nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON nutrition_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON nutrition_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for daily_logs
CREATE POLICY "Users can view own daily_logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_logs" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for usage_limits
CREATE POLICY "Users can view own usage_limits" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage_limits" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage_limits" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for body_reports
CREATE POLICY "Users can view own body_reports" ON body_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body_reports" ON body_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for daily_logs
ALTER PUBLICATION supabase_realtime ADD TABLE daily_logs;

-- Create gamification table for streaks and badges
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  streak_days INTEGER DEFAULT 0,
  total_meals_logged INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb, -- Array of earned badges
  last_log_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create fasting timer table
CREATE TABLE fasting_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  target_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for fasting_sessions
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fasting sessions" ON fasting_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fasting sessions" ON fasting_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fasting sessions" ON fasting_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create master_nutrients table for local-first nutrition lookup
-- All nutrients stored PER GRAM for consistent scaling
CREATE TABLE master_nutrients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_gram DECIMAL(10,4) NOT NULL, -- Calories per 1 gram
  protein_per_gram DECIMAL(10,4) NOT NULL, -- Protein per 1 gram
  carbs_per_gram DECIMAL(10,4) NOT NULL, -- Carbs per 1 gram
  fats_per_gram DECIMAL(10,4) NOT NULL, -- Fats per 1 gram
  search_terms TEXT[], -- Array of search terms for fuzzy matching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast name searches
CREATE INDEX idx_master_nutrients_name ON master_nutrients USING gin(to_tsvector('english', name));
CREATE INDEX idx_master_nutrients_search_terms ON master_nutrients USING gin(search_terms);

-- RLS for master_nutrients (read-only for users)
ALTER TABLE master_nutrients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view master_nutrients" ON master_nutrients
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for master_nutrients
CREATE TRIGGER update_master_nutrients_updated_at
  BEFORE UPDATE ON master_nutrients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create nutrition_database table for food items
CREATE TABLE nutrition_database (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- e.g., 'piece', '100g', '1 cup'
  calories_per_unit DECIMAL(10,2) NOT NULL,
  protein_per_unit DECIMAL(10,2) NOT NULL,
  carbs_per_unit DECIMAL(10,2) NOT NULL,
  fats_per_unit DECIMAL(10,2) NOT NULL,
  category TEXT, -- e.g., 'grains', 'protein', 'vegetables'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE nutrition_database ENABLE ROW LEVEL SECURITY;

-- Allow all users to read nutrition database
CREATE POLICY "Allow read access to nutrition database" ON nutrition_database FOR SELECT USING (true);

-- Insert sample Indian food items
INSERT INTO nutrition_database (name, unit, calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit, category) VALUES
('roti', 'piece', 104.00, 3.00, 17.00, 3.00, 'grains'),
('rice', '1 cup', 206.00, 4.00, 45.00, 0.00, 'grains'),
('dal', '1 cup', 180.00, 9.00, 20.00, 5.00, 'protein'),
('soya chunks', '100g', 345.00, 52.00, 12.00, 19.00, 'protein'),
('paneer', '100g', 265.00, 18.00, 3.00, 20.00, 'protein'),
('chicken breast', '100g', 165.00, 31.00, 0.00, 3.60, 'protein'),
('egg', 'piece', 78.00, 6.00, 0.60, 5.00, 'protein'),
('milk', '1 cup', 150.00, 8.00, 12.00, 8.00, 'dairy'),
('curd', '1 cup', 60.00, 3.00, 3.00, 3.00, 'dairy'),
('banana', 'piece', 105.00, 1.30, 27.00, 0.40, 'fruits'),
('apple', 'piece', 95.00, 0.50, 25.00, 0.30, 'fruits'),
('almonds', '10g', 57.00, 2.10, 2.10, 5.00, 'nuts'),
('ghee', '1 tbsp', 135.00, 0.00, 0.00, 15.00, 'fats');

-- Create workouts_history table
CREATE TABLE workouts_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  exercises_completed INTEGER,
  total_exercises INTEGER,
  workout_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for workouts_history
ALTER TABLE workouts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts" ON workouts_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_workouts_history_updated_at
  BEFORE UPDATE ON workouts_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  INSERT INTO public.nutrition_goals (user_id)
  VALUES (NEW.id);
  INSERT INTO public.usage_limits (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
