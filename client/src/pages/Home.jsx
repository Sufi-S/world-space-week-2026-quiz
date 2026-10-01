import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [topicProgress, setTopicProgress] = useState([]);

  useEffect(() => {
    api.getStats().then(setStats);
    api.getProgress().then(setProgress);
    api.getTopicProgress().then(setTopicProgress);
  }, []);

  if (!stats || !progress) return <div className="loading">Loading...</div>;

  const accuracy = progress.questions_attempted > 0
    ? Math.round((progress.questions_correct / progress.questions_attempted) * 100)
    : 0;

  const recent = topicProgress
    .filter(t => t.last_attempted)
    .sort((a, b) => b.last_attempted.localeCompare(a.last_attempted))
    .slice(0, 5);

  const recommended = topicProgress.find(t => {
    if (t.question_count === 0) return false;
    return !t.attempted || t.attempted < t.question_count;
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">World Space Week 2026</h1>
        <p className="page-subtitle">
          Rocket Revolution — Learn, understand, and master space science
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.topicCount}</div>
          <div className="stat-label">Topics</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.questionCount}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.questions_attempted}</div>
          <div className="stat-label">Attempted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      {progress.questions_attempted > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Overall Progress</h3>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.round((progress.questions_attempted / stats.questionCount) * 100)}%`,
                background: `linear-gradient(90deg, var(--primary), var(--accent))`,
              }}
            />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {progress.questions_attempted} of {stats.questionCount} questions attempted
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/topics" className="btn btn-primary" style={{ justifyContent: 'center', padding: '1rem' }}>
          Browse Topics
        </Link>
        <Link to="/practice" className="btn btn-accent" style={{ justifyContent: 'center', padding: '1rem' }}>
          Random Practice
        </Link>
        <Link to="/review" className="btn btn-outline" style={{ justifyContent: 'center', padding: '1rem' }}>
          Review Mistakes
        </Link>
        {recommended && (
          <Link
            to={`/topics/${recommended.id}`}
            className="btn btn-success"
            style={{ justifyContent: 'center', padding: '1rem', color: 'white' }}
          >
            Continue: {recommended.name}
          </Link>
        )}
      </div>

      {recent.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recently Practiced</h3>
          {recent.map(t => (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span>{t.name}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t.correct || 0}/{t.question_count} correct
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem', background: '#f0f4ff' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>About This Event</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Preparation material for the Quiz Competition at World Space Week 2026,
          organised by U R Rao Satellite Centre (URSC), ISRO, on October 6, 2026.
          Theme: <strong>Rocket Revolution</strong>.
        </p>
      </div>
    </div>
  );
}
