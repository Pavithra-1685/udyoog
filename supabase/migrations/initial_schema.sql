-- 1. Setup Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('initiation', 'planning', 'execution', 'monitoring', 'closure')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  primary_contact_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  company_website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique constraint per user
CREATE UNIQUE INDEX unique_company_per_user ON companies (user_id, LOWER(company_name));

-- 4. Positions Table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  activity_text TEXT NOT NULL,
  action_owner TEXT,
  action_item TEXT,
  help_required TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT activity_text_length CHECK (char_length(activity_text) <= 8000)
);

-- 6. User Ownership Automation (Professional Trigger Pattern)
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_id_companies BEFORE INSERT ON companies FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_positions BEFORE INSERT ON positions FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_activities BEFORE INSERT ON activities FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 7. Performance Indexes
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_positions_company_id ON positions(company_id);
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_date ON activities(date);

-- 8. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policies: Profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: Companies
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert their own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: Positions
CREATE POLICY "Users can view positions for their companies" ON positions
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert positions for their companies" ON positions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update positions for their companies" ON positions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete positions for their companies" ON positions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: Activities
CREATE POLICY "Users can view activities for their companies" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert activities for their companies" ON activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update activities for their companies" ON activities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete activities for their companies" ON activities
  FOR DELETE USING (auth.uid() = user_id);
