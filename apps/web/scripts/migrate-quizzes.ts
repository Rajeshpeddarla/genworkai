import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting migration...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      kb_id INTEGER REFERENCES knowledge_bases(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      rules JSONB,
      scope JSONB,
      status VARCHAR(50) DEFAULT 'draft',
      estimated_credits INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      difficulty VARCHAR(50),
      bloom_level VARCHAR(50),
      question_text TEXT NOT NULL,
      options JSONB,
      correct_answer TEXT,
      explanation TEXT,
      reference_file VARCHAR(255),
      reference_section TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'in_progress',
      score NUMERIC(5, 2) DEFAULT 0,
      total_marks NUMERIC(5, 2) DEFAULT 0,
      warnings_count INTEGER DEFAULT 0,
      anti_cheating_logs JSONB,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      user_answer TEXT,
      status VARCHAR(50) DEFAULT 'not_visited',
      is_correct BOOLEAN,
      marks_awarded NUMERIC(5, 2),
      ai_feedback TEXT,
      ai_graded_at TIMESTAMP,
      time_spent_ms INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      kb_id INTEGER REFERENCES knowledge_bases(id) ON DELETE SET NULL,
      type VARCHAR(50) NOT NULL,
      difficulty VARCHAR(50),
      bloom_level VARCHAR(50),
      topics JSONB,
      question_text TEXT NOT NULL,
      options JSONB,
      correct_answer TEXT,
      explanation TEXT,
      reference_file VARCHAR(255),
      reference_section TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
