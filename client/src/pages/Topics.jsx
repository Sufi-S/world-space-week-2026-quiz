import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const CATEGORIES = [
  { label: 'All', filter: () => true },
  { label: 'Astronomy', filter: t => t.id <= 16 },
  { label: 'Physics & Rockets', filter: t => t.id >= 17 && t.id <= 20 },
  { label: 'Indian Space Programme', filter: t => t.id >= 21 && t.id <= 41 },
  { label: 'International & Applications', filter: t => t.id >= 42 },
];

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [category, setCategory] = useState(0);

  useEffect(() => { api.getTopics().then(setTopics); }, []);

  if (!topics.length) return <div className="loading">Loading topics...</div>;

  const filtered = topics.filter(CATEGORIES[category].filter);

  return (
    <div>
      <h1 className="page-title">Topics</h1>
      <p className="page-subtitle">50 topics covering space science, ISRO missions, and astronomy</p>

      <div className="tabs" role="tablist" aria-label="Topic categories">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.label}
            role="tab"
            aria-selected={category === i}
            className={`tab ${category === i ? 'active' : ''}`}
            onClick={() => setCategory(i)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="topic-grid" role="tabpanel">
        {filtered.map(t => {
          const pct = t.question_count > 0 && t.correct > 0
            ? Math.round((t.correct / t.question_count) * 100)
            : 0;
          return (
            <Link key={t.id} to={`/topics/${t.id}`} className="topic-card">
              <h3>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>
                  {t.id}.{' '}
                </span>
                {t.name}
              </h3>
              <div className="meta">
                <span>{t.question_count} questions</span>
                {t.attempted > 0 && <span>{t.correct}/{t.attempted} correct</span>}
              </div>
              {t.question_count > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--accent)' : 'var(--primary)',
                    }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
