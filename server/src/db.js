import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'quiz.db');

let db = null;

export async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

export function saveDb() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function initDb() {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      learning_content TEXT,
      key_facts TEXT,
      important_terms TEXT,
      common_confusions TEXT,
      source_file TEXT,
      prerequisites TEXT DEFAULT '[]',
      question_count INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      question_number INTEGER,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'Medium',
      source TEXT,
      concept TEXT,
      tags TEXT DEFAULT '[]',
      verified INTEGER DEFAULT 0,
      flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      reviewer_notes TEXT,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      answered_correctly INTEGER NOT NULL,
      selected_answer TEXT,
      attempted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS topic_progress (
      topic_id INTEGER PRIMARY KEY,
      started INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      last_accessed TEXT,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS flagged_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      reason TEXT,
      flagged_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS validation_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER,
      topic_id INTEGER,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      resolved INTEGER DEFAULT 0
    )
  `);

  saveDb();
  return db;
}
