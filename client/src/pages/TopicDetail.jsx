import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';

function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="table-wrapper">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

const TABS = [
  { key: 'learn', label: 'Learn', field: 'learning_content', empty: 'No learning content available yet.' },
  { key: 'facts', label: 'Key Facts', field: 'key_facts', empty: 'No key facts available yet.' },
  { key: 'terms', label: 'Important Terms', field: 'important_terms', empty: 'No terms available yet.' },
  { key: 'confusions', label: 'Common Confusions', field: 'common_confusions', empty: 'No common confusions documented yet.' },
];

export default function TopicDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('learn');

  useEffect(() => {
    api.getTopic(id).then(setTopic);
  }, [id]);

  if (!topic) return <div className="loading">Loading topic...</div>;

  const currentTabData = TABS.find(t => t.key === activeTab);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link to="/topics" className="btn btn-outline btn-sm">
          &larr; All Topics
        </Link>
      </div>

      <h1 className="page-title" style={{ marginBottom: 'var(--space-xs)' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Topic {topic.id}:</span>{' '}
        {topic.name}
      </h1>

      {topic.prerequisites && topic.prerequisites.length > 0 && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
          Prerequisites:{' '}
          {topic.prerequisites.map((p, i) => (
            <span key={p}>
              {i > 0 && ', '}
              <Link to={`/topics/${p}`} style={{ color: 'var(--primary-light)' }}>Topic {p}</Link>
            </span>
          ))}
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Topic content tabs" style={{ marginTop: 'var(--space-md)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }} role="tabpanel">
        <div className="learning-content">
          <MarkdownContent>
            {topic[currentTabData.field] || currentTabData.empty}
          </MarkdownContent>
        </div>
      </div>

      {topic.question_count > 0 ? (
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to={`/topics/${topic.id}/practice`} className="btn btn-primary">
            Practice Questions ({topic.question_count})
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Easy`} className="btn btn-outline btn-sm">
            Easy
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Medium`} className="btn btn-outline btn-sm">
            Medium
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Hard`} className="btn btn-outline btn-sm">
            Hard
          </Link>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', background: 'var(--warning-subtle)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Questions for this topic are coming soon. You can still study the content above.
          </p>
        </div>
      )}
    </div>
  );
}
