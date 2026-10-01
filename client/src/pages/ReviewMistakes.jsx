import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ReviewMistakes() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    api.getIncorrect().then(setQuestions);
  }, []);

  if (!questions.length) {
    return (
      <div className="empty-state">
        <h2>No mistakes to review</h2>
        <p>Great job! You haven't gotten any questions wrong, or you've already corrected them.</p>
        <Link to="/practice" className="btn btn-primary" style={{ marginTop: '1rem' }}>Start Practicing</Link>
      </div>
    );
  }

  const q = questions[current];
  const options = [
    { letter: 'A', text: q.option_a },
    { letter: 'B', text: q.option_b },
    { letter: 'C', text: q.option_c },
    { letter: 'D', text: q.option_d },
  ].filter(o => o.text);

  return (
    <div>
      <h1 className="page-title">Review Mistakes</h1>
      <p className="page-subtitle">{questions.length} questions to review</p>

      <div className="progress-bar" style={{ marginBottom: '1.5rem' }}>
        <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%`, background: 'var(--error)' }} />
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {current + 1} / {questions.length} — {q.topic_name}
          </span>
        </div>

        <div className="question-text">{q.question}</div>

        <div className="options-list">
          {options.map(opt => (
            <div
              key={opt.letter}
              className={`option-btn disabled ${showAnswer && opt.letter === q.correct_answer ? 'correct' : ''}`}
            >
              <span className="option-letter">{opt.letter}</span>
              <span>{opt.text}</span>
            </div>
          ))}
        </div>

        {!showAnswer ? (
          <button className="btn btn-primary" onClick={() => setShowAnswer(true)} style={{ width: '100%', justifyContent: 'center' }}>
            Show Answer & Explanation
          </button>
        ) : (
          <>
            <div className="explanation-box">
              <h4>Answer: {q.correct_answer}</h4>
              <p>{q.explanation || 'No explanation available.'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {current > 0 && (
                <button className="btn btn-outline" onClick={() => { setCurrent(current - 1); setShowAnswer(false); }}>
                  &larr; Previous
                </button>
              )}
              {current < questions.length - 1 && (
                <button className="btn btn-accent" onClick={() => { setCurrent(current + 1); setShowAnswer(false); }} style={{ flex: 1, justifyContent: 'center' }}>
                  Next &rarr;
                </button>
              )}
              <Link to={`/topics/${q.topic_id}`} className="btn btn-outline btn-sm">
                Review Topic
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
