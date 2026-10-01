import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const LETTERS = ['A', 'B', 'C', 'D'];

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
      // Sort by difficulty: Easy first, then Medium, then Hard
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
    await api.flagQuestion(q.id, 'Flagged during practice');
  };

  if (!questions.length) {
    return (
      <div className="empty-state">
        <h2>No questions available</h2>
        <p>This topic doesn't have questions yet.</p>
        <Link to="/topics" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Topics</Link>
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

  return (
    <div>
      {topicId && (
        <Link to={`/topics/${topicId}`} className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }}>
          &larr; Back to Topic
        </Link>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{topicName}</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Question {currentIdx + 1} of {questions.length}
          {sessionStats.total > 0 && ` — ${sessionStats.correct}/${sessionStats.total} correct`}
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: '1.5rem' }}>
        <div
          className="progress-fill"
          style={{
            width: `${((currentIdx + (submitted ? 1 : 0)) / questions.length) * 100}%`,
            background: 'var(--primary)',
          }}
        />
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>
            {q.difficulty || 'Medium'}
          </span>
          <button className="btn btn-outline btn-sm" onClick={handleFlag} title="Flag this question">
            Flag
          </button>
        </div>

        <div className="question-text">{q.question}</div>

        <div className="options-list">
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
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
          >
            Submit Answer
          </button>
        ) : (
          <>
            <div className="explanation-box">
              <h4>
                {selected === q.correct_answer ? 'Correct!' : `Incorrect — The answer is ${q.correct_answer}`}
              </h4>
              <p>{q.explanation || 'No explanation available for this question.'}</p>
            </div>

            {isFinished ? (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <h3>Session Complete</h3>
                <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>
                  {sessionStats.correct} / {sessionStats.total} correct
                  ({Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
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
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '1rem' }}
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
