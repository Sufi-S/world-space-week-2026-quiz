const BASE = 'http://localhost:3001/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getTopics: () => get('/topics'),
  getTopic: (id) => get(`/topics/${id}`),
  getTopicQuestions: (id, difficulty) => get(`/topics/${id}/questions${difficulty ? `?difficulty=${difficulty}` : ''}`),
  getQuestions: (params) => get(`/questions?${new URLSearchParams(params)}`),
  getQuestion: (id) => get(`/questions/${id}`),
  updateQuestion: (id, data) => put(`/questions/${id}`, data),
  getRandomQuestions: (count) => get(`/questions/random/${count}`),
  getProgress: () => get('/progress'),
  getTopicProgress: () => get('/progress/topics'),
  submitAnswer: (data) => post('/progress', data),
  getIncorrect: () => get('/progress/incorrect'),
  flagQuestion: (id, reason) => post(`/questions/${id}/flag`, { reason }),
  unflagQuestion: (id) => del(`/questions/${id}/flag`),
  getFlagged: () => get('/flagged'),
  getValidation: () => get('/validation'),
  getStats: () => get('/stats'),
};
