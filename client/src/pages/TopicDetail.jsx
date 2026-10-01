import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';

export default function TopicDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('learn');

  useEffect(() => {
    api.getTopic(id).then(setTopic);
  }, [id]);

  if (!topic) return <div className="loading">Loading topic...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/topics" className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }}>
          &larr; All Topics
        </Link>
      </div>

      <h1 className="page-title">Topic {topic.id}: {topic.name}</h1>

      {topic.prerequisites && topic.prerequisites.length > 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Prerequisites: {topic.prerequisites.map(p => (
            <Link key={p} to={`/topics/${p}`} style={{ marginRight: '0.5rem' }}>Topic {p}</Link>
          ))}
        </p>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
          Learn
        </button>
        <button className={`tab ${activeTab === 'facts' ? 'active' : ''}`} onClick={() => setActiveTab('facts')}>
          Key Facts
        </button>
        <button className={`tab ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => setActiveTab('terms')}>
          Important Terms
        </button>
        <button className={`tab ${activeTab === 'confusions' ? 'active' : ''}`} onClick={() => setActiveTab('confusions')}>
          Common Confusions
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {activeTab === 'learn' && (
          <div className="learning-content">
            <ReactMarkdown>{topic.learning_content || 'No learning content available yet.'}</ReactMarkdown>
          </div>
        )}
        {activeTab === 'facts' && (
          <div className="learning-content">
            <ReactMarkdown>{topic.key_facts || 'No key facts available yet.'}</ReactMarkdown>
          </div>
        )}
        {activeTab === 'terms' && (
          <div className="learning-content">
            <ReactMarkdown>{topic.important_terms || 'No terms available yet.'}</ReactMarkdown>
          </div>
        )}
        {activeTab === 'confusions' && (
          <div className="learning-content">
            <ReactMarkdown>{topic.common_confusions || 'No common confusions documented yet.'}</ReactMarkdown>
          </div>
        )}
      </div>

      {topic.question_count > 0 ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/topics/${topic.id}/practice`} className="btn btn-primary">
            Practice Questions ({topic.question_count})
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Easy`} className="btn btn-outline btn-sm">
            Easy Only
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Medium`} className="btn btn-outline btn-sm">
            Medium Only
          </Link>
          <Link to={`/topics/${topic.id}/practice?difficulty=Hard`} className="btn btn-outline btn-sm">
            Hard Only
          </Link>
        </div>
      ) : (
        <div className="card" style={{ background: '#fff3e0', textAlign: 'center' }}>
          <p>Questions for this topic are coming soon. You can still study the learn content above.</p>
        </div>
      )}
    </div>
  );
}
