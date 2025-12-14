const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const InterviewQuestionRepository = require('../models/InterviewQuestionRepository');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');

const router = express.Router();

// Middleware to check if recruiter has access to the job's question repository
// Only recruiters from the same company (or independent recruiters who own the job) can access
// Company owners can access all jobs from their companies
async function checkRepositoryAccess(req, res, next) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const requestingRecruiter = await User.findById(req.user.id);
    if (!requestingRecruiter || requestingRecruiter.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can access interview questions' });
    }

    // If recruiter owns the job, allow access
    if (job.recruiterId.toString() === req.user.id) {
      return next();
    }

    // If job has a company, check if recruiter is the company owner
    if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        // Recruiter created this company, allow access
        return next();
      }
    }

    // If both have companyId and they match, allow access
    if (requestingRecruiter.companyId && job.companyId) {
      if (requestingRecruiter.companyId.toString() === job.companyId.toString()) {
        return next();
      }
    }

    // If both are independent (companyId is null), only owner can access
    if (!requestingRecruiter.companyId && !job.companyId) {
      return res.status(403).json({ message: 'Access denied: You can only access your own job repositories' });
    }

    // Different companies or one is independent and other is not
    return res.status(403).json({ message: 'Access denied: You can only access repositories from your company' });
  } catch (err) {
    return res.status(500).json({ message: 'Error checking access', error: err.message });
  }
}

// Get interview questions for a job
router.get(
  '/:jobId/questions',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      
      let repository = await InterviewQuestionRepository.findOne({ jobId });
      
      // If repository doesn't exist, create an empty one
      if (!repository) {
        const job = await Job.findById(jobId);
        const recruiter = await User.findById(req.user.id);
        
        repository = new InterviewQuestionRepository({
          jobId,
          companyId: job.companyId || null,
          questions: [],
          createdBy: req.user.id
        });
        await repository.save();
      }
      
      res.json({ repository });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching interview questions', error: err.message });
    }
  }
);

// Add a new question to the repository
router.post(
  '/:jobId/questions',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { question } = req.body;
      
      if (!question || !question.trim()) {
        return res.status(400).json({ message: 'Question text is required' });
      }

      let repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        const job = await Job.findById(jobId);
        repository = new InterviewQuestionRepository({
          jobId,
          companyId: job.companyId || null,
          questions: [question.trim()],
          createdBy: req.user.id
        });
      } else {
        repository.questions.push(question.trim());
      }
      
      await repository.save();
      res.status(201).json({ message: 'Question added successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error adding question', error: err.message });
    }
  }
);

// Update a specific question
router.put(
  '/:jobId/questions/:questionId',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  async (req, res) => {
    try {
      const { jobId, questionId } = req.params;
      const { question } = req.body;
      
      if (!question || !question.trim()) {
        return res.status(400).json({ message: 'Question text is required' });
      }

      const repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // questionId is the index in the questions array
      const index = parseInt(questionId, 10);
      if (isNaN(index) || index < 0 || index >= repository.questions.length) {
        return res.status(404).json({ message: 'Question not found' });
      }

      repository.questions[index] = question.trim();
      await repository.save();
      
      res.json({ message: 'Question updated successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error updating question', error: err.message });
    }
  }
);

// Delete a specific question
router.delete(
  '/:jobId/questions/:questionId',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  async (req, res) => {
    try {
      const { jobId, questionId } = req.params;

      const repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // questionId is the index in the questions array
      const index = parseInt(questionId, 10);
      if (isNaN(index) || index < 0 || index >= repository.questions.length) {
        return res.status(404).json({ message: 'Question not found' });
      }

      repository.questions.splice(index, 1);
      await repository.save();
      
      res.json({ message: 'Question deleted successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting question', error: err.message });
    }
  }
);

module.exports = router;

