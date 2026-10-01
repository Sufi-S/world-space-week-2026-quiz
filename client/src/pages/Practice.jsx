import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Practice() {
  const { id: topicId } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty');

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [topicName, setTopicName] = useState('');

  useEffect(() => {
    async function load() {
      let qs;
      if (topicId) {
        qs = await api.getTopicQuestions(topicId, difficulty);
        const topic = await api.getTopic(topicId);
        setTopicName(topic.name);
      } else {
        qs = await api.getRandomQuestions(20);
        setTopicName('Random Practice');
      }
      const order = { Easy: 0, Medium: 1, Hard: 2 };
      qs.sort((a, b) => (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1));
      setQuestions(qs);
      setCurrentIdx(0);
      setSelected(null);
      setSubmitted(false);
    }
    load();
  }, [topicId, difficulty]);

  const q = questions[currentIdx];

  const handleSubmit = useCallback(async () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selected === q.correct_answer;
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    try {
      await api.submitAnswer({
        question_id: q.id,
        topic_id: q.topic_id,
        answered_correctly: isCorrect,
        selected_answer: selected,
      });
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [selected, submitted, q]);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const handleFlag = async () => {
    if (!q) return;
    try {
      if (q.flagged) {
        await api.unflagQuestion(q.id);
        setQuestions(prev => prev.map(item =>
          item.id === q.id ? { ...item, flagged: 0, flag_reason: null } : item
        ));
      } else {
        await api.flagQuestion(q.id, 'Flagged during practice');
        setQuestions(prev => prev.map(item =>
          item.id === q.id ? { ...item, flagged: 1, flag_reason: 'Flagged during practice' } : item
        ));
      }
    } catch (e) {
      console.error('Flag operation failed:', e);
    }
  };

  useEffect(() => {
    if (!q || submitted) return;
    function handleKeyDown(e) {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const hasOption = key === 'A' ? q.option_a : key === 'B' ? q.option_b : key === 'C' ? q.option_c : q.option_d;
        if (hasOption) setSelected(key);
      }
      if (e.key === 'Enter' && selected !== null) handleSubmit();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [q, submitted, selected, handleSubmit]);

  if (!questions.length) {
    return (
      <div className="empty-state">
        <h2>No questions available</h2>
        <p>This topic doesn't have questions yet.</p>
        <Link to="/topics" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Browse Topics</Link>
      </div>
    );
  }

  if (!q) return <div className="loading">Loading...</div>;

  const options = [
    { letter: 'A', text: q.option_a },
    { letter: 'B', text: q.option_b },
    { letter: 'C', text: q.option_c },
    { letter: 'D', text: q.option_d },
  ].filter(o => o.text);

  const isFinished = submitted && currentIdx === questions.length - 1;
  const isCorrect = selected === q.correct_answer;

  return (
    <div>
      {topicId && (
        <Link to={`/topics/${topicId}`} className="btn btn-outline btn-sm" style={{ marginBottom: 'var(--space-md)' }}>
          &larr; Back to Topic
        </Link>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 650 }}>{topicName}</h2>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Question {currentIdx + 1} of {questions.length}
          {sessionStats.total > 0 && (
            <span style={{ marginLeft: '0.5rem' }}>
              {sessionStats.correct}/{sessionStats.total} correct
            </span>
          )}
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          className="progress-fill"
          style={{ width: `${((currentIdx + (submitted ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>
            {q.difficulty || 'Medium'}
          </span>
          <button
            className={`btn btn-sm ${q.flagged ? 'btn-flag-active' : 'btn-outline'}`}
            onClick={handleFlag}
            title={q.flagged ? 'Remove flag' : 'Flag this question'}
            aria-label={q.flagged ? 'Unflag this question' : 'Flag this question'}
          >
            {q.flagged ? '⚑ Flagged' : '⚐ Flag'}
          </button>
        </div>

        <div className="question-text">{q.question}</div>

        <div className="options-list" role="radiogroup" aria-label="Answer options">
          {options.map(opt => {
            let className = 'option-btn';
            if (submitted) {
              className += ' disabled';
              if (opt.letter === q.correct_answer) className += ' correct';
              else if (opt.letter === selected) className += ' incorrect';
            } else if (opt.letter === selected) {
              className += ' selected';
            }

            return (
              <button
                key={opt.letter}
                className={className}
                onClick={() => !submitted && setSelected(opt.letter)}
                disabled={submitted}
                role="radio"
                aria-checked={opt.letter === selected}
                aria-label={`Option ${opt.letter}: ${opt.text}`}
              >
                <span className="option-letter">{opt.letter}</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={selected === null}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            Submit Answer
          </button>
        ) : (
          <>
            <div className={`explanation-box ${isCorrect ? 'correct-answer' : 'incorrect-answer'}`}>
              <h4>
                {isCorrect ? 'Correct!' : `Incorrect — The answer is ${q.correct_answer}`}
              </h4>
              <p>{q.explanation || 'No explanation available for this question.'}</p>
              {q.source && (
                <p style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Source: {q.source}
                </p>
              )}
            </div>

            {isFinished ? (
              <div className="session-complete">
                <h3>Session Complete</h3>
                <div className="session-score">
                  {sessionStats.correct} / {sessionStats.total} correct
                  ({Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/topics" className="btn btn-outline">All Topics</Link>
                  {topicId && (
                    <Link to={`/topics/${topicId}`} className="btn btn-primary">Back to Topic</Link>
                  )}
                </div>
              </div>
            ) : (
              <button
                className="btn btn-accent"
                onClick={handleNext}
                style={{ width: '100%', padding: '0.75rem', marginTop: 'var(--space-md)' }}
              >
                Next Question &rarr;
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
