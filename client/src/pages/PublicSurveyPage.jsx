import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const PublicSurveyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/surveys/public/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Survey not found');
        } else {
          setError('Failed to load survey');
        }
        return;
      }
      const data = await response.json();
      setSurvey(data);
      
      // Initialize answers object
      const initialAnswers = {};
      data.questions.forEach(question => {
        if (question.question_type === 'checkbox') {
          initialAnswers[question.id] = [];
        } else {
          initialAnswers[question.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(opt => opt !== option)
        };
      }
    });
  };

  const validateAnswers = () => {
    if (!survey) return false;
    
    for (const question of survey.questions) {
      if (question.is_required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || 
            (typeof answer === 'string' && answer.trim() === '')) {
          setError(`Question "${question.question_text}" is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAnswers()) {
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = survey.questions.map(question => {
        const answer = answers[question.id];
        
        if (question.question_type === 'multiple_choice') {
          return {
            question_id: question.id,
            answer_options: [answer]
          };
        } else if (question.question_type === 'checkbox') {
          return {
            question_id: question.id,
            answer_options: answer
          };
        } else {
          return {
            question_id: question.id,
            answer_text: answer
          };
        }
      });

      const response = await fetch(`http://localhost:5000/api/responses/survey/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formattedAnswers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      setError(error.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const answer = answers[question.id];

    switch (question.question_type) {
      case 'short_answer':
        return (
          <div className="form-group">
            <label className="form-label">
              {index + 1}. {question.question_text}
              {question.is_required && <span className="text-error-600 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="form-input"
              placeholder="Type your answer here"
              required={question.is_required}
            />
          </div>
        );

      case 'paragraph':
        return (
          <div className="form-group">
            <label className="form-label">
              {index + 1}. {question.question_text}
              {question.is_required && <span className="text-error-600 ml-1">*</span>}
            </label>
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="form-input form-textarea"
              rows={4}
              placeholder="Type your answer here"
              required={question.is_required}
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="form-group">
            <label className="form-label">
              {index + 1}. {question.question_text}
              {question.is_required && <span className="text-error-600 ml-1">*</span>}
            </label>
            <div className="space-y-sm">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answer === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="form-radio"
                  />
                  <span className="text-body">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="form-group">
            <label className="form-label">
              {index + 1}. {question.question_text}
              {question.is_required && <span className="text-error-600 ml-1">*</span>}
            </label>
            <div className="space-y-sm">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-sm cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(answer || []).includes(option)}
                    onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-body">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="loading">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
              </div>
              <p className="text-body mt-4">Loading survey...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-24 h-24 text-error-600 mb-4">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M12 8v4m0 4h.01M12 8v4m0 4h.01M12 8v4m0 4h.01" />
                </svg>
              </div>
            </div>
            <h2 className="heading-2 mb-4">Survey Not Found</h2>
            <p className="text-body mb-8">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-24 h-24 text-success-600 mb-4">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10l0 0l0 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l-3 3 3-3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4H8l-1 4v4h1" />
                </svg>
              </div>
            </div>
            <h2 className="heading-2 mb-4">Thank You!</h2>
            <p className="text-body mb-8">
              Your response has been submitted successfully. We appreciate your feedback!
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="flex items-center justify-center flex-1">
        <div className="w-full max-w-2xl">
          <div className="card">
            <div className="card-body">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="heading-1">{survey?.title}</h1>
                {survey?.description && (
                  <p className="text-body mt-2">{survey.description}</p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-lg">
                {survey?.questions.map((question, index) => (
                  <div key={question.id} className="animate-fade-in">
                    {renderQuestion(question, index)}
                  </div>
                ))}

                {error && (
                  <div className="error animate-slide-in">
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn btn-primary btn-lg ${submitting ? 'loading' : ''}`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSurveyPage;
