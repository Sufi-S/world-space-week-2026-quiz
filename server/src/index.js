import express from 'express';
import cors from 'cors';
import { getDb, saveDb, initDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  db = await initDb();

  // --- TOPICS ---

  app.get('/api/topics', (req, res) => {
    const rows = db.exec(`
      SELECT t.id, t.name, t.description, t.question_count, t.prerequisites,
        (SELECT COUNT(*) FROM progress p WHERE p.topic_id = t.id) as attempted,
        (SELECT COUNT(*) FROM progress p WHERE p.topic_id = t.id AND p.answered_correctly = 1) as correct
      FROM topics t ORDER BY t.id
    `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, c === 'prerequisites' ? JSON.parse(r[i] || '[]') : r[i]]))));
  });

  app.get('/api/topics/:id', (req, res) => {
    const rows = db.exec('SELECT * FROM topics WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length || !rows[0].values.length) return res.status(404).json({ error: 'Topic not found' });
    const cols = rows[0].columns;
    const topic = Object.fromEntries(cols.map((c, i) => [c, c === 'prerequisites' ? JSON.parse(rows[0].values[0][i] || '[]') : rows[0].values[0][i]]));
    res.json(topic);
  });

  app.get('/api/topics/:id/questions', (req, res) => {
    const topicId = Number(req.params.id);
    const difficulty = req.query.difficulty;
    let sql = 'SELECT * FROM questions WHERE topic_id = ?';
    const params = [topicId];
    if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
    sql += ' ORDER BY question_number';
    const rows = db.exec(sql, params);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  // --- QUESTIONS ---

  app.get('/api/questions', (req, res) => {
    const { topic_id, difficulty, verified, flagged, search, limit, offset } = req.query;
    let sql = 'SELECT q.*, t.name as topic_name FROM questions q JOIN topics t ON q.topic_id = t.id WHERE 1=1';
    const params = [];
    if (topic_id) { sql += ' AND q.topic_id = ?'; params.push(Number(topic_id)); }
    if (difficulty) { sql += ' AND q.difficulty = ?'; params.push(difficulty); }
    if (verified !== undefined) { sql += ' AND q.verified = ?'; params.push(Number(verified)); }
    if (flagged !== undefined) { sql += ' AND q.flagged = ?'; params.push(Number(flagged)); }
    if (search) { sql += ' AND q.question LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY q.topic_id, q.question_number';
    if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }
    if (offset) { sql += ' OFFSET ?'; params.push(Number(offset)); }
    const rows = db.exec(sql, params);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  app.get('/api/questions/:id', (req, res) => {
    const rows = db.exec('SELECT q.*, t.name as topic_name FROM questions q JOIN topics t ON q.topic_id = t.id WHERE q.id = ?', [Number(req.params.id)]);
    if (!rows.length || !rows[0].values.length) return res.status(404).json({ error: 'Not found' });
    const cols = rows[0].columns;
    res.json(Object.fromEntries(cols.map((c, i) => [c, rows[0].values[0][i]])));
  });

  app.put('/api/questions/:id', (req, res) => {
    const id = Number(req.params.id);
    const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'difficulty', 'source', 'concept', 'tags', 'verified', 'flagged', 'flag_reason', 'reviewer_notes'];
    const updates = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    db.run(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDb();
    res.json({ ok: true });
  });

  // --- PROGRESS ---

  app.get('/api/progress', (req, res) => {
    const stats = db.exec(`
      SELECT
        (SELECT COUNT(DISTINCT question_id) FROM progress) as questions_attempted,
        (SELECT COUNT(DISTINCT question_id) FROM progress WHERE answered_correctly = 1) as questions_correct,
        (SELECT COUNT(DISTINCT topic_id) FROM progress) as topics_touched,
        (SELECT COUNT(*) FROM topics) as total_topics,
        (SELECT COUNT(*) FROM questions) as total_questions
    `);
    if (!stats.length) return res.json({});
    const cols = stats[0].columns;
    const row = stats[0].values[0];
    res.json(Object.fromEntries(cols.map((c, i) => [c, row[i]])));
  });

  app.get('/api/progress/topics', (req, res) => {
    const rows = db.exec(`
      SELECT t.id, t.name, t.question_count,
        COUNT(DISTINCT p.question_id) as attempted,
        SUM(CASE WHEN p.answered_correctly = 1 THEN 1 ELSE 0 END) as correct,
        MAX(p.attempted_at) as last_attempted
      FROM topics t
      LEFT JOIN progress p ON p.topic_id = t.id
      GROUP BY t.id
      ORDER BY t.id
    `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  app.post('/api/progress', (req, res) => {
    const { question_id, topic_id, answered_correctly, selected_answer } = req.body;
    db.run(
      'INSERT INTO progress (question_id, topic_id, answered_correctly, selected_answer) VALUES (?, ?, ?, ?)',
      [question_id, topic_id, answered_correctly ? 1 : 0, selected_answer]
    );
    saveDb();
    res.json({ ok: true });
  });

  app.get('/api/progress/incorrect', (req, res) => {
    const rows = db.exec(`
      SELECT DISTINCT q.*, t.name as topic_name FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN progress p ON p.question_id = q.id
      WHERE p.answered_correctly = 0
      AND q.id NOT IN (SELECT question_id FROM progress WHERE answered_correctly = 1)
      ORDER BY q.topic_id, q.question_number
    `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  // --- FLAGGED ---

  app.post('/api/questions/:id/flag', (req, res) => {
    const qId = Number(req.params.id);
    const { reason } = req.body;
    db.run('UPDATE questions SET flagged = 1, flag_reason = ? WHERE id = ?', [reason || '', qId]);
    db.run('INSERT OR REPLACE INTO flagged_questions (question_id, reason) VALUES (?, ?)', [qId, reason || '']);
    saveDb();
    res.json({ ok: true });
  });

  app.delete('/api/questions/:id/flag', (req, res) => {
    const qId = Number(req.params.id);
    db.run('UPDATE questions SET flagged = 0, flag_reason = NULL WHERE id = ?', [qId]);
    db.run('DELETE FROM flagged_questions WHERE question_id = ?', [qId]);
    saveDb();
    res.json({ ok: true });
  });

  app.get('/api/flagged', (req, res) => {
    const rows = db.exec(`
      SELECT q.*, t.name as topic_name, f.reason as flag_reason_detail, f.flagged_at
      FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN flagged_questions f ON f.question_id = q.id
      ORDER BY f.flagged_at DESC
    `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  // --- VALIDATION ---

  app.get('/api/validation', (req, res) => {
    const rows = db.exec(`
      SELECT v.*, t.name as topic_name
      FROM validation_issues v
      LEFT JOIN topics t ON v.topic_id = t.id
      ORDER BY CASE v.severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, v.topic_id
    `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  // --- STATS ---

  app.get('/api/stats', (req, res) => {
    const topicCount = db.exec('SELECT COUNT(*) FROM topics')[0].values[0][0];
    const questionCount = db.exec('SELECT COUNT(*) FROM questions')[0].values[0][0];
    const byDifficulty = db.exec('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty');
    const byTopic = db.exec('SELECT topic_id, COUNT(*) as count FROM questions GROUP BY topic_id ORDER BY topic_id');
    const verified = db.exec('SELECT COUNT(*) FROM questions WHERE verified = 1')[0].values[0][0];
    const flagged = db.exec('SELECT COUNT(*) FROM questions WHERE flagged = 1')[0].values[0][0];
    const withExplanation = db.exec("SELECT COUNT(*) FROM questions WHERE explanation IS NOT NULL AND explanation != ''")[0].values[0][0];
    const withSource = db.exec("SELECT COUNT(*) FROM questions WHERE source IS NOT NULL AND source != ''")[0].values[0][0];
    const issues = db.exec('SELECT severity, COUNT(*) as count FROM validation_issues GROUP BY severity');

    res.json({
      topicCount,
      questionCount,
      verified,
      flagged,
      withExplanation,
      withSource,
      byDifficulty: byDifficulty.length ? Object.fromEntries(byDifficulty[0].values.map(r => [r[0], r[1]])) : {},
      byTopic: byTopic.length ? byTopic[0].values.map(r => ({ topic_id: r[0], count: r[1] })) : [],
      issues: issues.length ? Object.fromEntries(issues[0].values.map(r => [r[0], r[1]])) : {},
    });
  });

  // --- RANDOM QUESTIONS ---

  app.get('/api/questions/random/:count', (req, res) => {
    const count = Math.min(Number(req.params.count) || 10, 100);
    const rows = db.exec('SELECT q.*, t.name as topic_name FROM questions q JOIN topics t ON q.topic_id = t.id ORDER BY RANDOM() LIMIT ?', [count]);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    res.json(rows[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]]))));
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
