import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [validation, setValidation] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ topic_id: '', difficulty: '', verified: '', flagged: '', search: '' });

  useEffect(() => {
    api.getStats().then(setStats);
    api.getTopics().then(setTopics);
    api.getValidation().then(setValidation);
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.topic_id) params.topic_id = filters.topic_id;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.verified) params.verified = filters.verified;
    if (filters.flagged) params.flagged = filters.flagged;
    if (filters.search) params.search = filters.search;
    api.getQuestions(params).then(setQuestions);
  }, [filters]);

  if (!stats) return <div className="loading">Loading admin...</div>;

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>

      <div className="tabs">
        {['overview', 'questions', 'validation'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stat-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.topicCount}</div>
              <div className="stat-label">Topics</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.questionCount}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-label">Verified</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.flagged}</div>
              <div className="stat-label">Flagged</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withExplanation}</div>
              <div className="stat-label">With Explanations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withSource}</div>
              <div className="stat-label">With Sources</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Difficulty Distribution</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {Object.entries(stats.byDifficulty || {}).map(([d, count]) => (
                <div key={d}>
                  <span className={`badge badge-${d.toLowerCase()}`}>{d}</span>
                  <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Questions per Topic</h3>
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Topic</th><th>Questions</th><th>Action</th></tr>
              </thead>
              <tbody>
                {topics.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.name}</td>
                    <td>{t.question_count}</td>
                    <td>
                      <Link to={`/topics/${t.id}`} className="btn btn-outline btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Validation Issues ({validation.length})</h3>
            {validation.length === 0 ? (
              <p style={{ color: 'var(--success)' }}>No issues found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Severity</th><th>Type</th><th>Topic</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {validation.slice(0, 20).map((v, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ color: v.severity === 'error' ? 'var(--error)' : v.severity === 'warning' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {v.severity}
                        </span>
                      </td>
                      <td>{v.issue_type}</td>
                      <td>{v.topic_name || `Topic ${v.topic_id}`}</td>
                      <td>{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <>
          <div className="filter-bar">
            <select value={filters.topic_id} onChange={e => setFilters({ ...filters, topic_id: e.target.value })}>
              <option value="">All Topics</option>
              {topics.map(t => <option key={t.id} value={t.id}>Topic {t.id}: {t.name}</option>)}
            </select>
            <select value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={filters.flagged} onChange={e => setFilters({ ...filters, flagged: e.target.value })}>
              <option value="">All Status</option>
              <option value="1">Flagged</option>
              <option value="0">Not Flagged</option>
            </select>
            <input
              placeholder="Search questions..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {questions.length} results
            </span>
          </div>

          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Topic</th><th>Question</th><th>Diff</th><th>Ans</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td style={{ fontSize: '0.8rem' }}>{q.topic_name}</td>
                    <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.question}
                    </td>
                    <td><span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span></td>
                    <td>{q.correct_answer}</td>
                    <td>
                      {q.flagged ? <span style={{ color: 'var(--error)' }}>Flagged</span> : null}
                      {q.verified ? <span style={{ color: 'var(--success)' }}>Verified</span> : null}
                    </td>
                    <td>
                      <Link to={`/admin/question/${q.id}`} className="btn btn-outline btn-sm">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'validation' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>All Validation Issues ({validation.length})</h3>
          <table className="admin-table">
            <thead>
              <tr><th>Severity</th><th>Type</th><th>Topic</th><th>Description</th></tr>
            </thead>
            <tbody>
              {validation.map((v, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ color: v.severity === 'error' ? 'var(--error)' : v.severity === 'warning' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      {v.severity}
                    </span>
                  </td>
                  <td>{v.issue_type}</td>
                  <td>{v.topic_name || `Topic ${v.topic_id}`}</td>
                  <td>{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
