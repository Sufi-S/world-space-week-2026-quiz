import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function AdminQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [allIds, setAllIds] = useState([]);

  useEffect(() => {
    api.getQuestions({}).then(qs => setAllIds(qs.map(q => q.id)));
  }, []);

  useEffect(() => {
    api.getQuestion(id).then(data => {
      setQ(data);
      setForm(data);
      setEditing(false);
      setSaved(false);
    });
  }, [id]);

  if (!q) return <div className="loading">Loading question...</div>;

  const currentIndex = allIds.indexOf(q.id);
  const prevId = currentIndex > 0 ? allIds[currentIndex - 1] : null;
  const nextId = currentIndex < allIds.length - 1 ? allIds[currentIndex + 1] : null;

  const handleSave = async () => {
    await api.updateQuestion(q.id, form);
    setQ({ ...q, ...form });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleVerify = async () => {
    await api.updateQuestion(q.id, { verified: 1 });
    setQ({ ...q, verified: 1 });
    setForm({ ...form, verified: 1 });
  };

  const handleFlag = async () => {
    const reason = prompt('Flag reason:');
    if (reason === null) return;
    await api.flagQuestion(q.id, reason);
    setQ({ ...q, flagged: 1, flag_reason: reason });
    setForm({ ...form, flagged: 1, flag_reason: reason });
  };

  const handleUnflag = async () => {
    await api.unflagQuestion(q.id);
    setQ({ ...q, flagged: 0, flag_reason: null });
    setForm({ ...form, flagged: 0, flag_reason: null });
  };

  const Field = ({ label, field, textarea }) => (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {editing ? (
        textarea ? (
          <textarea
            className="edit-field"
            value={form[field] || ''}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
          />
        ) : (
          <input
            className="edit-field"
            value={form[field] || ''}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
          />
        )
      ) : (
        <div style={{ padding: '0.4rem 0', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.92rem' }}>{q[field] || <em style={{ color: 'var(--text-muted)' }}>Empty</em>}</div>
      )}
    </div>
  );

  const validations = [];
  if (!q.explanation) validations.push({ icon: '!', text: 'Missing explanation', color: 'var(--warning)' });
  if (!q.source) validations.push({ icon: '!', text: 'Missing source', color: 'var(--warning)' });
  if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) validations.push({ icon: 'X', text: 'Invalid answer', color: 'var(--error)' });
  if (q.explanation) validations.push({ icon: '✓', text: 'Has explanation', color: 'var(--success)' });
  if (q.source) validations.push({ icon: '✓', text: 'Has source', color: 'var(--success)' });
  if (['A', 'B', 'C', 'D'].includes(q.correct_answer)) validations.push({ icon: '✓', text: 'Valid answer', color: 'var(--success)' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <Link to="/admin" className="btn btn-outline btn-sm">&larr; Admin</Link>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {prevId && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/question/${prevId}`)}>Prev</button>}
          {nextId && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/question/${nextId}`)}>Next</button>}
        </div>
      </div>

      <div className="card" style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 650 }}>Question #{q.id}</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Topic {q.topic_id}: {q.topic_name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
            {q.verified ? <span className="badge" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>Verified</span> : null}
            {q.flagged ? <span className="badge" style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}>Flagged</span> : null}
          </div>
        </div>

        <Field label="Question" field="question" textarea />
        <Field label="Option A" field="option_a" />
        <Field label="Option B" field="option_b" />
        <Field label="Option C" field="option_c" />
        <Field label="Option D" field="option_d" />

        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Correct Answer
          </label>
          {editing ? (
            <select
              className="edit-field"
              value={form.correct_answer || ''}
              onChange={e => setForm({ ...form, correct_answer: e.target.value })}
              style={{ width: 'auto' }}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          ) : (
            <div style={{ padding: '0.4rem 0', fontWeight: 700, color: 'var(--success)' }}>{q.correct_answer}</div>
          )}
        </div>

        <Field label="Explanation" field="explanation" textarea />
        <Field label="Source" field="source" />

        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Difficulty
          </label>
          {editing ? (
            <select
              className="edit-field"
              value={form.difficulty || 'Medium'}
              onChange={e => setForm({ ...form, difficulty: e.target.value })}
              style={{ width: 'auto' }}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          ) : (
            <div style={{ padding: '0.4rem 0', fontSize: '0.92rem' }}>{q.difficulty}</div>
          )}
        </div>

        <Field label="Reviewer Notes" field="reviewer_notes" textarea />

        {q.flag_reason && (
          <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--error-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--error)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--error)', marginBottom: '0.2rem' }}>Flag Reason</div>
            <div style={{ fontSize: '0.88rem' }}>{q.flag_reason}</div>
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Validation</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm) var(--space-md)' }}>
            {validations.map((v, i) => (
              <div key={i} className="validation-badge" style={{ color: v.color }}>
                {v.icon} {v.text}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {editing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              <button className="btn btn-outline" onClick={() => { setForm(q); setEditing(false); }}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
          )}
          {!q.verified && <button className="btn btn-success" onClick={handleVerify}>Mark Verified</button>}
          {q.flagged ? (
            <button className="btn btn-outline" onClick={handleUnflag}>Unflag</button>
          ) : (
            <button className="btn btn-outline" onClick={handleFlag} style={{ color: 'var(--error)' }}>Flag</button>
          )}
          {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 500 }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
}
