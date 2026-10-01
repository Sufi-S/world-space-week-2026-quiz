import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, saveDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH_DIR = path.join(__dirname, '..', '..', 'research');

const PREREQUISITE_MAP = {
  1: [], 2: [1], 3: [2], 4: [2], 5: [2], 6: [2, 5], 7: [2], 8: [2], 9: [2], 10: [2],
  11: [1], 12: [1, 11], 13: [11, 12], 14: [2, 11], 15: [1], 16: [15],
  17: [19], 18: [17, 19], 19: [2], 20: [1, 2],
  21: [20], 22: [21], 23: [21], 24: [21, 23], 25: [17, 21], 26: [17, 25], 27: [17, 25], 28: [22],
  29: [18, 22], 30: [18, 22], 31: [18, 22], 32: [22, 30],
  33: [6, 21, 25], 34: [33], 35: [34], 36: [7, 21, 25], 37: [3, 21], 38: [15, 16, 21], 39: [21, 26], 40: [39], 41: [21],
  42: [19, 20], 43: [20, 42], 44: [20], 45: [20], 46: [6, 33, 35], 47: [7, 36], 48: [18], 49: [29, 30, 31, 32], 50: [17, 20, 21],
};

const TOPIC_FILES = [
  { file: 'temp_topics_1_2.md', topicIds: [1, 2] },
  { file: 'topics_3_10.md', topicIds: [3, 4, 5, 6, 7, 8, 9, 10] },
  { file: 'tmp_topics_11_12.md', topicIds: [11, 12] },
  { file: 'tmp_topics_13_14.md', topicIds: [13, 14] },
  { file: 'tmp_topics_15_16.md', topicIds: [15, 16] },
  { file: 'topics_17_18.md', topicIds: [17, 18] },
  { file: 'tmp_topics_19_20.md', topicIds: [19, 20] },
  { file: 'topics_21_24.md', topicIds: [21, 22, 23, 24] },
  { file: 'topics_25_28.md', topicIds: [25, 26, 27, 28] },
  { file: 'topics_29_32.md', topicIds: [29, 30, 31, 32] },
  { file: 'topics_33_41.md', topicIds: [33, 34, 35, 36, 37, 38, 39, 40, 41] },
  { file: 'topics_42_45.md', topicIds: [42, 43, 44, 45] },
  { file: 'topics_46_50.md', topicIds: [46, 47, 48, 49, 50] },
];

function splitIntoTopics(content) {
  const topicRegex = /^(#{1,2})\s*Topic\s*(\d+)\s*[–—:\-.]\s*(.+)$/gm;
  const matches = [];
  let match;
  while ((match = topicRegex.exec(content)) !== null) {
    matches.push({ id: parseInt(match[2]), name: match[3].trim(), index: match.index });
  }

  return matches.map((m, i) => {
    const start = m.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    return { id: m.id, name: m.name, body: content.slice(start, end) };
  });
}

function extractSection(body, sectionName) {
  const patterns = [
    new RegExp(`^###\\s*${sectionName}\\s*$`, 'm'),
    new RegExp(`^####\\s*${sectionName}\\s*$`, 'm'),
    new RegExp(`^##\\s*${sectionName}\\s*$`, 'm'),
  ];
  let startIdx = -1;
  for (const p of patterns) {
    const m = p.exec(body);
    if (m) { startIdx = m.index + m[0].length; break; }
  }
  if (startIdx === -1) return '';

  const rest = body.slice(startIdx);
  const endMatch = /^#{2,4}\s+[A-Z]/m.exec(rest);
  return (endMatch ? rest.slice(0, endMatch.index) : rest).trim();
}

function extractLearningContent(body) {
  const markers = ['### Learn This Topic', '### Learn this Topic'];
  let startIdx = -1;
  for (const m of markers) {
    const idx = body.indexOf(m);
    if (idx !== -1) { startIdx = idx + m.length; break; }
  }
  if (startIdx === -1) return '';

  const endMarkers = ['### Key Facts', '### Important Terms', '### Common Confusions', '### Questions for Topic'];
  let endIdx = body.length;
  for (const m of endMarkers) {
    const idx = body.indexOf(m, startIdx);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return body.slice(startIdx, endIdx).trim();
}

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

async function runImport() {
  const db = await initDb();
  db.run('DELETE FROM validation_issues');
  db.run('DELETE FROM flagged_questions');
  db.run('DELETE FROM progress');
  db.run('DELETE FROM topic_progress');
  db.run('DELETE FROM questions');
  db.run('DELETE FROM topics');

  let totalTopics = 0, totalQuestions = 0, totalIssues = 0;

  for (const entry of TOPIC_FILES) {
    const filePath = path.join(RESEARCH_DIR, entry.file);
    if (!fs.existsSync(filePath)) { console.warn(`Missing: ${entry.file}`); continue; }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rawTopics = splitIntoTopics(content);

    for (const raw of rawTopics) {
      const lc = extractLearningContent(raw.body);
      const kf = extractSection(raw.body, 'Key Facts');
      const it = extractSection(raw.body, 'Important Terms');
      const cc = extractSection(raw.body, 'Common Confusions');
      const questions = parseQuestions(raw.body);
      const prereqs = JSON.stringify(PREREQUISITE_MAP[raw.id] || []);

      db.run(
        `INSERT INTO topics (id, name, description, learning_content, key_facts, important_terms, common_confusions, source_file, prerequisites, question_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [raw.id, raw.name, raw.name, lc, kf, it, cc, entry.file, prereqs, questions.length]
      );
      totalTopics++;

      for (const q of questions) {
        db.run(
          `INSERT INTO questions (topic_id, question_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [raw.id, q.question_number, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation, q.difficulty, q.source]
        );
        totalQuestions++;
        const qId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];

        if (!q.explanation) {
          db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
            [qId, raw.id, 'missing_explanation', `Q${q.question_number}: no explanation`, 'warning']);
          totalIssues++;
        }
        if (!q.source) {
          db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
            [qId, raw.id, 'missing_source', `Q${q.question_number}: no source`, 'info']);
          totalIssues++;
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
          db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
            [qId, raw.id, 'invalid_answer', `Q${q.question_number}: answer "${q.correct_answer}" not A-D`, 'error']);
          totalIssues++;
        }
      }

      if (!lc || lc.length < 50) {
        db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
          [null, raw.id, 'thin_content', `Topic ${raw.id} has thin learning content`, 'warning']);
        totalIssues++;
      }
      if (questions.length === 0) {
        db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
          [null, raw.id, 'no_questions', `Topic ${raw.id} (${raw.name}) has no questions`, 'info']);
        totalIssues++;
      }
    }
  }

  // Duplicate detection
  const allQs = db.exec('SELECT id, topic_id, question FROM questions ORDER BY id');
  if (allQs.length) {
    const qs = allQs[0].values;
    function normalize(t) { return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(); }
    function wordSet(t) { return new Set(normalize(t).split(' ').filter(w => w.length > 2)); }
    for (let i = 0; i < qs.length; i++) {
      const wordsI = wordSet(qs[i][2]);
      for (let j = i + 1; j < qs.length; j++) {
        const wordsJ = wordSet(qs[j][2]);
        let inter = 0;
        for (const w of wordsI) if (wordsJ.has(w)) inter++;
        const sim = inter / (wordsI.size + wordsJ.size - inter);
        if (sim >= 0.7) {
          db.run('INSERT INTO validation_issues (question_id, topic_id, issue_type, description, severity) VALUES (?,?,?,?,?)',
            [qs[j][0], qs[j][1], 'duplicate', `Q${qs[i][0]} and Q${qs[j][0]} are ${Math.round(sim * 100)}% similar`, 'warning']);
          totalIssues++;
        }
      }
    }
  }

  saveDb();

  console.log(`\nImport complete:`);
  console.log(`  Topics:  ${totalTopics}`);
  console.log(`  Questions: ${totalQuestions}`);
  console.log(`  Issues:  ${totalIssues}`);

  const rows = db.exec('SELECT id, name, question_count FROM topics ORDER BY id');
  if (rows.length) {
    console.log('\nPer-topic:');
    for (const row of rows[0].values) {
      console.log(`  Topic ${row[0]}: ${row[1]} — ${row[2]} Qs`);
    }
  }
}

runImport();
