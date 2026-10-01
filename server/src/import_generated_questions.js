import fs from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';
import { initDb, saveDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN_DIR = path.join(__dirname, '..', '..', 'research', 'generated_questions');
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'quiz.db');
const BACKUP_PATH = DB_PATH + '.backup_before_import';

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port);
  });
}

// --- Parsing (reused from importer.js) ---

function parseQuestions(body) {
  const qRegex = /^###\s*Question\s*(\d+)\s*$/gm;
  const matches = [];
  let m;
  while ((m = qRegex.exec(body)) !== null) {
    matches.push({ num: parseInt(m[1]), index: m.index + m[0].length });
  }

  const questions = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length
      ? body.lastIndexOf('### Question', matches[i + 1].index)
      : body.length;
    const block = body.slice(start, end).trim();
    const lines = block.split('\n');

    let questionText = '', optA = '', optB = '', optC = '', optD = '';
    let answer = '', difficulty = 'Medium', source = '';
    let mode = 'question';
    const explanationLines = [];

    for (const line of lines) {
      const t = line.trim();
      if (/^A[).]\s/.test(t)) { optA = t.replace(/^A[).]\s*/, ''); mode = 'options'; }
      else if (/^B[).]\s/.test(t)) { optB = t.replace(/^B[).]\s*/, ''); }
      else if (/^C[).]\s/.test(t)) { optC = t.replace(/^C[).]\s*/, ''); }
      else if (/^D[).]\s/.test(t)) { optD = t.replace(/^D[).]\s*/, ''); }
      else if (/^\*\*Answer:?\*\*/.test(t)) { answer = t.replace(/^\*\*Answer:?\*\*\s*/, '').trim(); }
      else if (/^\*\*Explanation:?\*\*/.test(t)) {
        mode = 'explanation';
        const inline = t.replace(/^\*\*Explanation:?\*\*\s*/, '').trim();
        if (inline) explanationLines.push(inline);
      }
      else if (/^\*\*Difficulty:?\*\*/.test(t)) { difficulty = t.replace(/^\*\*Difficulty:?\*\*\s*/, '').trim(); mode = 'done'; }
      else if (/^\*\*Source:?\*\*/.test(t)) { source = t.replace(/^\*\*Source:?\*\*\s*/, '').trim(); mode = 'done'; }
      else if (mode === 'question' && t && !t.startsWith('---') && !t.startsWith('#')) {
        questionText += (questionText ? ' ' : '') + t;
      }
      else if (mode === 'explanation' && t && !/^\*\*/.test(t)) {
        explanationLines.push(t);
      }
    }

    if (questionText && optA && optB && answer) {
      questions.push({
        question_number: matches[i].num,
        question: questionText,
        option_a: optA, option_b: optB, option_c: optC, option_d: optD,
        correct_answer: answer,
        explanation: explanationLines.join(' '),
        difficulty: normalizeDifficulty(difficulty),
        source,
      });
    }
  }
  return questions;
}

function normalizeDifficulty(d) {
  const l = d.toLowerCase();
  if (l.includes('easy')) return 'Easy';
  if (l.includes('hard') || l.includes('difficult')) return 'Hard';
  return 'Medium';
}

// --- Option shuffling (Fisher-Yates) ---

function shuffleOptions(optA, optB, optC, optD, correctAnswer) {
  const options = [
    { text: optA, origLetter: 'A' },
    { text: optB, origLetter: 'B' },
    { text: optC, origLetter: 'C' },
    { text: optD, origLetter: 'D' },
  ];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const newLetters = ['A', 'B', 'C', 'D'];
  const newCorrectIdx = options.findIndex(o => o.origLetter === correctAnswer);

  return {
    option_a: options[0].text,
    option_b: options[1].text,
    option_c: options[2].text,
    option_d: options[3].text,
    correct_answer: newLetters[newCorrectIdx],
  };
}

// --- Duplicate detection ---

function normalize(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// --- Main import ---

async function run() {
  // 0. Ensure the API server is NOT running (it uses sql.js in-memory and will overwrite our changes)
  const portFree = await checkPortFree(3001);
  if (!portFree) {
    console.error('ERROR: Port 3001 is in use — the API server is likely running.');
    console.error('Stop the server before importing, or it will overwrite the database with stale data.');
    process.exit(1);
  }

  // 1. Back up database
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`Database backed up to: ${path.basename(BACKUP_PATH)}`);
  }

  const db = await initDb();

  // 2. Snapshot existing state
  const beforeTotal = db.exec('SELECT COUNT(*) FROM questions')[0].values[0][0];
  const existingByTopic = {};
  const rows = db.exec('SELECT topic_id, COUNT(*) FROM questions GROUP BY topic_id');
  if (rows.length) {
    for (const r of rows[0].values) existingByTopic[r[0]] = r[1];
  }
  console.log(`\nExisting questions in DB: ${beforeTotal}`);
  console.log(`Topics with questions: ${Object.keys(existingByTopic).join(', ')}\n`);

  // 3. Load existing question texts for dedup
  const existingTexts = new Set();
  const existingResult = db.exec('SELECT question FROM questions');
  if (existingResult.length) {
    for (const r of existingResult[0].values) existingTexts.add(normalize(r[0]));
  }

  // 4. Read generated files
  const files = fs.readdirSync(GEN_DIR)
    .filter(f => f.match(/^topic_\d+.*\.md$/))
    .sort();

  console.log(`Found ${files.length} generated question files\n`);

  let totalImported = 0;
  let totalSkipped = 0;
  let totalParsed = 0;
  const parseErrors = [];
  const perFile = [];
  const answerDist = { A: 0, B: 0, C: 0, D: 0 };

  for (const file of files) {
    const match = file.match(/^topic_(\d+)/);
    if (!match) { parseErrors.push(`Cannot extract topic ID from: ${file}`); continue; }
    const topicId = parseInt(match[1]);

    // Verify topic exists
    const topicCheck = db.exec(`SELECT id, name FROM topics WHERE id = ${topicId}`);
    if (!topicCheck.length || !topicCheck[0].values.length) {
      parseErrors.push(`Topic ${topicId} not found in DB for file ${file}`);
      continue;
    }
    const topicName = topicCheck[0].values[0][1];

    // Skip topics that already have questions in the DB (the original 530)
    if (existingByTopic[topicId]) {
      console.log(`  SKIP ${file} — topic ${topicId} already has ${existingByTopic[topicId]} questions in DB`);
      continue;
    }

    const content = fs.readFileSync(path.join(GEN_DIR, file), 'utf-8');
    const questions = parseQuestions(content);
    totalParsed += questions.length;

    let fileImported = 0;
    let fileSkipped = 0;

    for (const q of questions) {
      const normQ = normalize(q.question);

      // Dedup check
      if (existingTexts.has(normQ)) {
        fileSkipped++;
        totalSkipped++;
        continue;
      }

      // Validate required fields
      if (!q.question || !q.option_a || !q.option_b) {
        parseErrors.push(`Topic ${topicId}, Q${q.question_number}: missing question text or options`);
        continue;
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        parseErrors.push(`Topic ${topicId}, Q${q.question_number}: invalid answer "${q.correct_answer}"`);
        continue;
      }

      // Shuffle options
      const s = shuffleOptions(q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer);

      // Verify shuffle integrity: the text at the new correct position must match original correct text
      const origCorrectText = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[q.correct_answer];
      const newCorrectText = { A: s.option_a, B: s.option_b, C: s.option_c, D: s.option_d }[s.correct_answer];
      if (origCorrectText !== newCorrectText) {
        parseErrors.push(`Topic ${topicId}, Q${q.question_number}: shuffle integrity failure`);
        continue;
      }

      // Insert
      db.run(
        `INSERT INTO questions (topic_id, question_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [topicId, q.question_number, q.question, s.option_a, s.option_b, s.option_c, s.option_d, s.correct_answer, q.explanation, q.difficulty, q.source]
      );

      answerDist[s.correct_answer]++;
      existingTexts.add(normQ);
      fileImported++;
      totalImported++;
    }

    perFile.push({ file, topicId, topicName, parsed: questions.length, imported: fileImported, skipped: fileSkipped });
    console.log(`  ${file}: parsed ${questions.length}, imported ${fileImported}, skipped ${fileSkipped} → topic ${topicId} (${topicName})`);
  }

  // 5. Update question_count for all topics
  db.run(`UPDATE topics SET question_count = (SELECT COUNT(*) FROM questions WHERE questions.topic_id = topics.id)`);

  // 6. Save
  saveDb();

  // --- Validation ---
  console.log('\n========== POST-IMPORT VALIDATION ==========\n');

  const afterTotal = db.exec('SELECT COUNT(*) FROM questions')[0].values[0][0];
  console.log(`Total questions in DB: ${afterTotal}`);
  console.log(`  Existing before import: ${beforeTotal}`);
  console.log(`  Newly imported: ${totalImported}`);
  console.log(`  Skipped (exact dedup): ${totalSkipped}`);
  console.log(`  Expected total: ${beforeTotal + totalImported}`);
  console.log(`  Match: ${afterTotal === beforeTotal + totalImported ? 'YES' : 'NO — MISMATCH!'}`);

  // Per-topic counts
  console.log('\n--- Questions per topic ---');
  const topicCounts = db.exec('SELECT t.id, t.name, t.question_count FROM topics t ORDER BY t.id');
  let topicsWithQs = 0;
  if (topicCounts.length) {
    for (const r of topicCounts[0].values) {
      const mark = r[2] === 0 ? ' *** NO QUESTIONS ***' : '';
      console.log(`  Topic ${String(r[0]).padStart(2)}: ${String(r[2]).padStart(3)} Qs — ${r[1]}${mark}`);
      if (r[2] > 0) topicsWithQs++;
    }
  }
  console.log(`\nTopics with questions: ${topicsWithQs}/50`);

  // Answer distribution (new imports only)
  console.log('\n--- Answer distribution (newly imported questions) ---');
  const distTotal = answerDist.A + answerDist.B + answerDist.C + answerDist.D;
  for (const letter of ['A', 'B', 'C', 'D']) {
    const pct = distTotal > 0 ? ((answerDist[letter] / distTotal) * 100).toFixed(1) : '0.0';
    console.log(`  ${letter}: ${answerDist[letter]} (${pct}%)`);
  }

  // Full DB answer distribution
  console.log('\n--- Answer distribution (entire database) ---');
  const fullDist = db.exec("SELECT correct_answer, COUNT(*) FROM questions GROUP BY correct_answer ORDER BY correct_answer");
  if (fullDist.length) {
    for (const r of fullDist[0].values) {
      const pct = ((r[1] / afterTotal) * 100).toFixed(1);
      console.log(`  ${r[0]}: ${r[1]} (${pct}%)`);
    }
  }

  // Validation: missing fields
  console.log('\n--- Field completeness check ---');
  const missingExpl = db.exec("SELECT COUNT(*) FROM questions WHERE explanation IS NULL OR explanation = ''")[0].values[0][0];
  const missingSource = db.exec("SELECT COUNT(*) FROM questions WHERE source IS NULL OR source = ''")[0].values[0][0];
  const missingDiff = db.exec("SELECT COUNT(*) FROM questions WHERE difficulty IS NULL OR difficulty = ''")[0].values[0][0];
  const missingOptD = db.exec("SELECT COUNT(*) FROM questions WHERE option_d IS NULL OR option_d = ''")[0].values[0][0];
  const invalidAns = db.exec("SELECT COUNT(*) FROM questions WHERE correct_answer NOT IN ('A','B','C','D')")[0].values[0][0];
  console.log(`  Missing explanation: ${missingExpl}`);
  console.log(`  Missing source: ${missingSource}`);
  console.log(`  Missing difficulty: ${missingDiff}`);
  console.log(`  Missing option_d: ${missingOptD}`);
  console.log(`  Invalid answer (not A-D): ${invalidAns}`);

  // Difficulty distribution
  console.log('\n--- Difficulty distribution (entire database) ---');
  const diffDist = db.exec("SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty ORDER BY difficulty");
  if (diffDist.length) {
    for (const r of diffDist[0].values) console.log(`  ${r[0]}: ${r[1]}`);
  }

  // Verify original 530 were NOT modified
  console.log('\n--- Original question integrity check ---');
  const origTopicIds = [1, 2, 11, 12, 13, 14, 15, 16, 19, 20];
  let origOk = true;
  for (const tid of origTopicIds) {
    const count = db.exec(`SELECT COUNT(*) FROM questions WHERE topic_id = ${tid}`)[0].values[0][0];
    const expected = existingByTopic[tid] || 0;
    if (count !== expected) {
      console.log(`  MISMATCH: Topic ${tid} had ${expected}, now has ${count}`);
      origOk = false;
    }
  }
  const origTotal = db.exec(`SELECT COUNT(*) FROM questions WHERE topic_id IN (${origTopicIds.join(',')})`)[0].values[0][0];
  console.log(`  Original 530 questions: ${origTotal} (${origTotal === 530 ? 'INTACT' : 'MODIFIED — ERROR!'})`);
  if (origOk) console.log(`  Per-topic counts: all match original`);

  // Parse errors
  if (parseErrors.length) {
    console.log('\n--- Parse/validation errors ---');
    for (const e of parseErrors) console.log(`  ERROR: ${e}`);
  } else {
    console.log('\n--- Parse/validation errors: NONE ---');
  }

  console.log('\n========== IMPORT COMPLETE ==========');
}

run().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
