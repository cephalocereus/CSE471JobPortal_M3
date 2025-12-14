const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const {
  getRecommendationPayload,
  trackSearchTerm
} = require('../services/recommendationService');

const router = express.Router();

const escapeRegex = (input = '') =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get recruiter's company jobs (all jobs from their company)
router.get('/recruiter/jobs', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const Company = require('../models/Company');
    
    // Build query: jobs from recruiter's company
    const query = {};
    
    if (recruiter.companyId) {
      // Recruiter belongs to a company: show all jobs from that company
      query.companyId = recruiter.companyId;
    } else {
      // Check if recruiter created any companies
      const createdCompanies = await Company.find({ recruiterId: req.user.id }).select('_id');
      const companyIds = createdCompanies.map(c => c._id);
      
      if (companyIds.length > 0) {
        // Recruiter created companies: show jobs from those companies
        query.companyId = { $in: companyIds };
      } else {
        // Independent recruiter with no companies: show their own jobs
        query.recruiterId = req.user.id;
      }
    }

    const jobs = await Job.find(query)
      .populate('applicants', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get only recruiter's own jobs (for "My Job Postings" tab)
router.get('/recruiter/my-jobs', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .populate('applicants', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get all active jobs (with optional search logging)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const searchTerm = (req.query.q || '').trim();
    const query = { isActive: true };

    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { company: regex },
        { location: regex },
        { skills: { $elemMatch: { $regex: regex } } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    // Always record authenticated searches to build history for recommendations
    if (searchTerm && req.user?.id) {
      await trackSearchTerm(req.user.id, searchTerm);
    }

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get applicant's applications with full job details (MUST be before /:id route)
router.get('/applicant/applications', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user.id })
      .populate({
        path: 'jobId',
        populate: {
          path: 'recruiterId',
          select: 'name email company'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// Withdraw application (MUST be before /:id route)
router.delete('/application/:id', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.applicantId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to withdraw this application' });
    }

    // Remove from job's applicants list
    const job = await Job.findById(application.jobId);
    if (job) {
      job.applicants = job.applicants.filter(id => id.toString() !== req.user.id);
      await job.save();
    }

    await Application.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Application withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error withdrawing application', error: err.message });
  }
});

// NEW: Get personalized recommendations (applicant only) - MUST be before /:id route
router.get('/recommendations', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const searchTerm = (req.query.q || '').trim();
    
    console.log('[recommendations API] Request received:', {
      userId: req.user?.id,
      searchTerm: searchTerm || 'none'
    });
    
    // Track search term if provided (from filter boxes)
    if (searchTerm && req.user?.id) {
      try {
        await trackSearchTerm(req.user.id, searchTerm);
        console.log('[recommendations API] Search term tracked:', searchTerm);
      } catch (trackErr) {
        console.error('[recommendations API] Error tracking search term:', trackErr);
        // Don't fail the request if tracking fails
      }
    }
    
    const payload = await getRecommendationPayload(req.user.id);
    console.log('[recommendations API] Payload prepared:', {
      keywords: payload.keywords?.length || 0,
      personalized: payload.personalized?.length || 0,
      collaborative: payload.collaborative?.length || 0,
      trends: payload.trends?.length || 0,
      trendJobs: payload.trendJobs?.length || 0
    });
    
    res.json(payload);
  } catch (err) {
    console.error('[recommendations API] Error:', err);
    console.error('[recommendations API] Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching recommendations', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all saved jobs for applicant (MUST be before /:id route)
router.get('/applicant/saved', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedJobs',
      populate: {
        path: 'recruiterId',
        select: 'name email company'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ jobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved jobs', error: err.message });
  }
});

// Get single job by ID (MUST be after specific routes)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiterId', 'name email company');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job', error: err.message });
  }
});

// Create a new job (recruiter only)
router.post('/create', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const { companyId: selectedCompanyId, ...restBody } = req.body;
    const Company = require('../models/Company');

    // Validate company selection
    let finalCompanyId = null;
    if (selectedCompanyId) {
      // Check if company exists and recruiter has access to it
      const company = await Company.findById(selectedCompanyId);
      if (!company) {
        return res.status(400).json({ message: 'Selected company not found' });
      }

      // Recruiter must either belong to this company OR be the creator
      if (company.recruiterId.toString() === req.user.id) {
        // Recruiter created this company
        finalCompanyId = selectedCompanyId;
      } else if (recruiter.companyId && recruiter.companyId.toString() === selectedCompanyId) {
        // Recruiter belongs to this company
        finalCompanyId = selectedCompanyId;
      } else {
        return res.status(403).json({ message: 'You can only post jobs for companies you belong to or created' });
      }
    } else if (recruiter.companyId) {
      // If no company selected but recruiter belongs to a company, use that
      finalCompanyId = recruiter.companyId;
    }

    const jobData = {
      ...restBody,
      recruiterId: req.user.id,
      companyId: finalCompanyId,
      positions: req.body.positions ? Number(req.body.positions) : 1
    };
    const job = new Job(jobData);
    await job.save();
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error creating job', error: err.message });
  }
});

// Apply for a job (applicant only)
router.post('/:id/apply', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { resume, coverLetter, skills, experience } = req.body;

    const job = await Job.findById(jobId);
    if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found or inactive' });

    const existingApp = await Application.findOne({ jobId, applicantId: req.user.id });
    if (existingApp) return res.status(400).json({ message: 'You have already applied for this job' });

    const application = new Application({
      jobId,
      applicantId: req.user.id,
      resume,
      coverLetter,
      skills: skills || [],
      experience: experience || ''
    });

    await application.save();

    // Add applicant to job's applicants list
    if (!job.applicants.includes(req.user.id)) {
      job.applicants.push(req.user.id);
      await job.save();
    }

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Error applying for job', error: err.message });
  }
});

// Update job (recruiter only)
router.put('/:id', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this job' });
    }

    // Preserve companyId - it should not be changed via update
    const companyIdToPreserve = job.companyId;
    
    Object.assign(job, req.body);
    
    // Restore companyId to prevent it from being changed
    job.companyId = companyIdToPreserve;
    
    if (typeof req.body.positions !== 'undefined') {
      job.positions = Number(req.body.positions) || 1;
    }
    await job.save();
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error updating job', error: err.message });
  }
});

// Close job (recruiter only) - marks job as inactive but keeps it in database
router.put('/:id/close', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to close this job' });
    }

    job.isActive = false;
    await job.save();
    res.json({ message: 'Job closed successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error closing job', error: err.message });
  }
});

// Delete job (recruiter only) - permanently deletes the job and associated applications
router.delete('/:id', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this job' });
    }

    // Delete all applications associated with this job
    await Application.deleteMany({ jobId: req.params.id });

    // Delete the job itself
    await Job.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Job and associated applications deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting job', error: err.message });
  }
});

// Save job to wishlist (applicant only) - MUST be before generic /:id route
router.post('/:id/save', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }
    
    res.json({ message: 'Job saved successfully', isSaved: true });
  } catch (err) {
    res.status(500).json({ message: 'Error saving job', error: err.message });
  }
});

// Unsave job from wishlist (applicant only) - MUST be before generic /:id route
router.delete('/:id/unsave', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user.id);
    
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    await user.save();
    
    res.json({ message: 'Job removed from saved jobs', isSaved: false });
  } catch (err) {
    res.status(500).json({ message: 'Error removing saved job', error: err.message });
  }
});

// Check if job is saved by applicant - MUST be before generic /:id route
router.get('/:id/is-saved', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isSaved = user.savedJobs.includes(req.params.id);
    
    res.json({ isSaved });
  } catch (err) {
    res.status(500).json({ message: 'Error checking save status', error: err.message });
  }
});

// Get applications for a specific job (recruiter only) - MUST be before generic /:id route
router.get('/:id/applications', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view applications for this job' });
    }

    const applications = await Application.find({ jobId })
      .populate('applicantId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ applications, job });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// Update application status (recruiter only)
router.put('/application/:id/status', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Applied', 'Reviewed', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    
    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to update this application' });
    }

    application.status = status;
    await application.save();
    
    res.json({ message: 'Application status updated successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Error updating application status', error: err.message });
  }
});

// Get company analytics (recruiter only)
router.get('/company/:companyId/analytics', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const Company = require('../models/Company');
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify recruiter has access to this company
    const recruiter = await User.findById(req.user.id);
    let hasAccess = false;
    
    if (company.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && recruiter.companyId.toString() === companyId) {
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view analytics for this company' });
    }

    // Get all jobs for this company (with recruiter info populated)
    const jobs = await Job.find({ companyId })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    const jobIds = jobs.map(j => j._id);
    
    // Get all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } });
    
    // Calculate statistics
    const totalApplications = applications.length;
    const acceptedCount = applications.filter(app => app.status === 'Accepted').length;
    const rejectedCount = applications.filter(app => app.status === 'Rejected').length;
    const reviewedCount = applications.filter(app => app.status === 'Reviewed').length;
    const appliedCount = applications.filter(app => app.status === 'Applied').length;
    const activeJobsCount = jobs.filter(job => job.isActive).length;
    const closedJobsCount = jobs.filter(job => !job.isActive).length;
    
    // Get applications per job (for the table)
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const jobApps = applications.filter(app => app.jobId.toString() === job._id.toString());
        return {
          jobTitle: job.title,
          totalApplicants: jobApps.length,
          accepted: jobApps.filter(app => app.status === 'Accepted').length,
          rejected: jobApps.filter(app => app.status === 'Rejected').length,
          reviewed: jobApps.filter(app => app.status === 'Reviewed').length,
          applied: jobApps.filter(app => app.status === 'Applied').length,
          isActive: job.isActive
        };
      })
    );
    
    res.json({
      company: {
        name: company.name,
        id: company._id
      },
      summary: {
        totalApplications,
        acceptedCount,
        rejectedCount,
        reviewedCount,
        appliedCount,
        activeJobsCount,
        closedJobsCount,
        totalJobsCount: jobs.length
      },
      jobsWithApplications,
      jobs: jobs // Include full job details for displaying job listings
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics', error: err.message });
  }
});

module.exports = router;