import React, { useState, useEffect } from 'react';
import { interviewQuestionAPI } from '../api';
import '../styles/Dashboard.css';

const InterviewQuestionBank = ({ jobId, jobTitle }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [jobId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await interviewQuestionAPI.getQuestions(jobId);
      setQuestions(response.data.repository?.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.addQuestion(jobId, newQuestion);
      setQuestions(response.data.repository.questions);
      setNewQuestion('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding question');
      console.error('Error adding question:', err);
    }
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditText(questions[index]);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleUpdateQuestion = async (index) => {
    if (!editText.trim()) {
      setError('Question cannot be empty');
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.updateQuestion(jobId, index, editText);
      setQuestions(response.data.repository.questions);
      setEditingIndex(null);
      setEditText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating question');
      console.error('Error updating question:', err);
    }
  };

  const handleDeleteQuestion = async (index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.deleteQuestion(jobId, index);
      setQuestions(response.data.repository.questions);
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditText('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting question');
      console.error('Error deleting question:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading interview questions...</div>;
  }

  return (
    <div className="interview-question-bank">
      <div className="section-header">
        <h3>Interview Question Bank</h3>
        <p className="job-title-subtitle">for {jobTitle}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAddQuestion} className="add-question-form">
        <div className="form-group">
          <label htmlFor="newQuestion">Add New Question</label>
          <textarea
            id="newQuestion"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter an interview question..."
            rows="3"
            required
          />
        </div>
        <button type="submit" className="btn-primary">Add Question</button>
      </form>

      <div className="questions-list">
        <h4>Saved Questions ({questions.length})</h4>
        {questions.length === 0 ? (
          <p className="no-questions">No questions added yet. Start building your question bank!</p>
        ) : (
          <ul className="questions-list-items">
            {questions.map((question, index) => (
              <li key={index} className="question-item">
                {editingIndex === index ? (
                  <div className="question-edit">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="3"
                      className="edit-textarea"
                    />
                    <div className="question-actions">
                      <button
                        onClick={() => handleUpdateQuestion(index)}
                        className="btn-primary btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="question-display">
                    <div className="question-number">{index + 1}.</div>
                    <div className="question-text">{question}</div>
                    <div className="question-actions">
                      <button
                        onClick={() => handleStartEdit(index)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestionBank;

