import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [validation, setValidation] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ topic_id: '', difficulty: '', verified: '', flagged: '', search: '' });

  useEffect(() => {
    api.getStats().then(setStats);
    api.getTopics().then(setTopics);
    api.getValidation().then(setValidation);
    api.getDuplicates().then(setDuplicates);
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

      <div className="tabs" role="tablist">
        {['overview', 'questions', 'validation', 'duplicates'].map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stat-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.topicCount}</div>
              <div className="stat-label">Topics</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.questionCount.toLocaleString()}</div>
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
              <div className="stat-value">{stats.withExplanation.toLocaleString()}</div>
              <div className="stat-label">Explanations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withSource.toLocaleString()}</div>
              <div className="stat-label">Sources</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3>Difficulty Distribution</h3>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
              {Object.entries(stats.byDifficulty || {}).map(([d, count]) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className={`badge badge-${d.toLowerCase()}`}>{d}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3>Questions per Topic</h3>
            <div className="admin-table-wrapper">
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
          </div>

          <div className="card">
            <h3>Validation Issues ({validation.length})</h3>
            {validation.length === 0 ? (
              <p style={{ color: 'var(--success)', fontSize: '0.88rem' }}>No issues found.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Severity</th><th>Type</th><th>Topic</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    {validation.slice(0, 20).map((v, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{ color: v.severity === 'error' ? 'var(--error)' : v.severity === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                            {v.severity}
                          </span>
                        </td>
                        <td>{v.issue_type}</td>
                        <td>{v.topic_name || `Topic ${v.topic_id}`}</td>
                        <td style={{ fontSize: '0.8rem' }}>{v.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <>
          <div className="filter-bar">
            <select value={filters.topic_id} onChange={e => setFilters({ ...filters, topic_id: e.target.value })} aria-label="Filter by topic">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t.id} value={t.id}>Topic {t.id}: {t.name}</option>)}
            </select>
            <select value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })} aria-label="Filter by difficulty">
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={filters.flagged} onChange={e => setFilters({ ...filters, flagged: e.target.value })} aria-label="Filter by flag status">
              <option value="">All Status</option>
              <option value="1">Flagged</option>
              <option value="0">Not Flagged</option>
            </select>
            <input
              placeholder="Search questions..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              aria-label="Search questions"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {questions.length} results
            </span>
          </div>

          <div className="card">
            <div className="admin-table-wrapper">
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
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{q.topic_name}</td>
                      <td style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.question}
                      </td>
                      <td><span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span></td>
                      <td style={{ fontWeight: 600 }}>{q.correct_answer}</td>
                      <td>
                        {q.flagged ? <span style={{ color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600 }}>Flagged</span> : null}
                        {q.verified ? <span style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}>Verified</span> : null}
                      </td>
                      <td>
                        <Link to={`/admin/question/${q.id}`} className="btn btn-outline btn-sm">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'validation' && (
        <div className="card">
          <h3>All Validation Issues ({validation.length})</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Severity</th><th>Type</th><th>Topic</th><th>Description</th></tr>
              </thead>
              <tbody>
                {validation.map((v, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ color: v.severity === 'error' ? 'var(--error)' : v.severity === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {v.severity}
                      </span>
                    </td>
                    <td>{v.issue_type}</td>
                    <td>{v.topic_name || `Topic ${v.topic_id}`}</td>
                    <td style={{ fontSize: '0.8rem' }}>{v.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="card">
          <h3>Potential Duplicates ({duplicates.length})</h3>
          {duplicates.length === 0 ? (
            <p style={{ color: 'var(--success)', fontSize: '0.88rem' }}>No duplicate questions detected.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {duplicates.map((d, i) => (
                <div key={i} style={{ padding: 'var(--space-md)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${d.similarity >= 90 ? 'var(--error)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600 }}>{d.similarity}% similar</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Topic {d.topic_a} vs Topic {d.topic_b}
                    </span>
                  </div>
                  <div style={{ marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                      <Link to={`/admin/question/${d.question_a_id}`}>Q#{d.question_a_id}</Link>
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{d.text_a}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                      <Link to={`/admin/question/${d.question_b_id}`}>Q#{d.question_b_id}</Link>
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{d.text_b}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
