-- Database Schema for Survey Application System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (using Supabase auth.users as reference)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'paragraph', 'checkbox')),
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- For multiple choice and checkbox questions
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_email TEXT, -- Optional email for respondents
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_options JSONB, -- For multiple choice and checkbox answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view_all_surveys', 'manage_all_surveys', 'view_all_users', 'manage_users', 'system_admin')),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'survey', 'system'
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

-- Admin table indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Survey policies
CREATE POLICY "Users can view own surveys" ON surveys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own surveys" ON surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own surveys" ON surveys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own surveys" ON surveys FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public surveys are viewable by everyone" ON surveys FOR SELECT USING (is_public = true);

-- Admin survey policies
CREATE POLICY "Admins can view all surveys" ON surveys FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage all surveys" ON surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

-- Question policies
CREATE POLICY "Users can view questions for their own surveys" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.user_id = auth.uid())
);
CREATE POLICY "Users can view questions for public surveys" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.is_public = true)
);
CREATE POLICY "Users can manage questions for their own surveys" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.user_id = auth.uid())
);

-- Response policies
CREATE POLICY "Users can view responses for their own surveys" ON responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM surveys WHERE surveys.id = responses.survey_id AND surveys.user_id = auth.uid())
);
CREATE POLICY "Anyone can create responses for public surveys" ON responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM surveys WHERE surveys.id = responses.survey_id AND surveys.is_public = true)
);

-- Answer policies
CREATE POLICY "Users can view answers for their own surveys" ON answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM responses 
           JOIN surveys ON responses.survey_id = surveys.id 
           WHERE responses.id = answers.response_id AND surveys.user_id = auth.uid())
);
CREATE POLICY "Anyone can create answers for public surveys" ON answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM responses 
           JOIN surveys ON responses.survey_id = surveys.id 
           WHERE responses.id = answers.response_id AND surveys.is_public = true)
);

-- Admin policies for other tables
CREATE POLICY "Admins can view all questions" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage all questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can view all responses" ON responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage all responses" ON responses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin'))
);

CREATE POLICY "Admins can view all answers" ON answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage all answers" ON answers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin'))
);

-- Admin permissions policies
CREATE POLICY "Admins can manage permissions" ON admin_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Admin activity log policies
CREATE POLICY "Admins can view activity log" ON admin_activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can create activity log" ON admin_activity_log FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Admin functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.role IN ('admin', 'super_admin')
    AND profiles.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.role = 'super_admin'
    AND profiles.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  admin_id UUID,
  action TEXT,
  target_type TEXT DEFAULT NULL,
  target_id UUID DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
  VALUES (admin_id, action, target_type, target_id, details)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
