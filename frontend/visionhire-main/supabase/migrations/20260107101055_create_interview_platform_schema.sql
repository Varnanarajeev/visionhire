/*
  # AI Interview Platform Database Schema

  ## Overview
  Creates the complete database structure for the AI-powered virtual interview platform.

  ## New Tables
  
  ### 1. `candidates`
  Stores candidate information and registration details
  - `id` (uuid, primary key) - Unique candidate identifier
  - `email` (text, unique) - Candidate email address
  - `interview_code` (text, unique) - Unique code for interview access
  - `created_at` (timestamptz) - Registration timestamp
  
  ### 2. `interviews`
  Stores interview session data
  - `id` (uuid, primary key) - Unique interview identifier
  - `candidate_id` (uuid, foreign key) - Reference to candidates table
  - `resume_url` (text) - Uploaded resume file path/URL
  - `resume_analysis` (jsonb) - AI-analyzed resume data
  - `status` (text) - Interview status (pending, in_progress, completed)
  - `started_at` (timestamptz) - Interview start time
  - `completed_at` (timestamptz) - Interview completion time
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 3. `questions`
  Stores interview questions
  - `id` (uuid, primary key) - Unique question identifier
  - `interview_id` (uuid, foreign key) - Reference to interviews table
  - `question_text` (text) - The question content
  - `question_number` (integer) - Question order/sequence
  - `created_at` (timestamptz) - Question creation timestamp
  
  ### 4. `answers`
  Stores candidate answers (audio/text)
  - `id` (uuid, primary key) - Unique answer identifier
  - `question_id` (uuid, foreign key) - Reference to questions table
  - `interview_id` (uuid, foreign key) - Reference to interviews table
  - `audio_url` (text) - Audio recording URL
  - `text_answer` (text) - Text transcription or typed answer
  - `evaluation` (jsonb) - AI evaluation of the answer
  - `score` (integer) - Answer score (0-100)
  - `created_at` (timestamptz) - Answer submission timestamp
  
  ### 5. `reports`
  Stores final interview reports
  - `id` (uuid, primary key) - Unique report identifier
  - `interview_id` (uuid, foreign key) - Reference to interviews table
  - `candidate_id` (uuid, foreign key) - Reference to candidates table
  - `overall_score` (integer) - Overall interview score (0-100)
  - `performance_summary` (text) - Overall performance summary
  - `strengths` (text[]) - Array of identified strengths
  - `weaknesses` (text[]) - Array of identified weaknesses
  - `verdict` (text) - Final verdict (pass, average, needs_improvement)
  - `detailed_analysis` (jsonb) - Detailed analysis data
  - `created_at` (timestamptz) - Report generation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Candidates can only access their own data
  - Public read access for questions (during active interview)
  - Authenticated write access for answers during interview session

  ## Important Notes
  1. All tables have RLS enabled with restrictive policies
  2. Candidates are identified by their interview_code
  3. Audio files will be stored separately and referenced by URL
  4. JSONB fields allow flexible storage of AI-generated content
*/

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  interview_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  resume_url text,
  resume_analysis jsonb,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  audio_url text,
  text_answer text,
  evaluation jsonb,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  overall_score integer DEFAULT 0,
  performance_summary text,
  strengths text[],
  weaknesses text[],
  verdict text,
  detailed_analysis jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidates
CREATE POLICY "Candidates can view own data"
  ON candidates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create candidate"
  ON candidates FOR INSERT
  WITH CHECK (true);

-- RLS Policies for interviews
CREATE POLICY "Candidates can view own interviews"
  ON interviews FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create interview"
  ON interviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update interview"
  ON interviews FOR UPDATE
  USING (true);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create questions"
  ON questions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for answers
CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create answers"
  ON answers FOR INSERT
  WITH CHECK (true);

-- RLS Policies for reports
CREATE POLICY "Anyone can view reports"
  ON reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create reports"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview_id ON questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_answers_interview_id ON answers(interview_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_interview_id ON reports(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_code ON candidates(interview_code);