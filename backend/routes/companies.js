const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Company = require('../models/Company');

const router = express.Router();

// Public endpoint to get all companies (for signup dropdown)
router.get('/public', async (req, res, next) => {
  try {
    const companies = await Company.find().select('name _id').sort({ name: 1 });
    res.json({ companies });
  } catch (err) {
    next(err);
  }
});

// Get all companies with full details (for applicants to browse)
router.get('/all', verifyToken, authorizeRole('applicant'), async (req, res, next) => {
  try {
    const companies = await Company.find()
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ companies });
  } catch (err) {
    next(err);
  }
});

// Get single company details (for applicants)
router.get('/:id/details', verifyToken, authorizeRole('applicant'), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('recruiterId', 'name email');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ company });
  } catch (err) {
    next(err);
  }
});

// Get company analytics (for applicants - public view)
router.get('/:id/analytics', verifyToken, authorizeRole('applicant'), async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const Job = require('../models/Job');
    const Application = require('../models/Application');
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get all jobs for this company (populate recruiter info for job cards)
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
    
    // Get applications per job
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
        id: company._id,
        bio: company.bio,
        description: company.description,
        location: company.location,
        website: company.website,
        logoUrl: company.logoUrl
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
      jobs: jobs // Include full job details for applicants to browse and apply
    });
  } catch (err) {
    next(err);
  }
});

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return cb(null, imageExts.includes(ext));
  }
});

// Create company
router.post(
  '/',
  verifyToken,
  authorizeRole('recruiter'),
  upload.single('companyLogo'),
  async (req, res, next) => {
    try {
      const { name, website, description, location, bio } = req.body;
      if (!name) return res.status(400).json({ message: 'Company name is required' });

      const payload = {
        recruiterId: req.user.id,
        name: name.trim(),
        website: website?.trim(),
        description,
        location: location?.trim(),
        bio
      };

      if (req.file) {
        payload.logoUrl = `/uploads/${req.file.filename}`;
      }

      const company = new Company(payload);
      await company.save();

      res.status(201).json({ company });
    } catch (err) {
      next(err);
    }
  }
);

// Get all companies for recruiter
router.get(
  '/',
  verifyToken,
  authorizeRole('recruiter'),
  async (req, res, next) => {
    try {
      const companies = await Company.find({ recruiterId: req.user.id }).sort({ createdAt: -1 });
      res.json({ companies });
    } catch (err) {
      next(err);
    }
  }
);

// Get single company
router.get(
  '/:id',
  verifyToken,
  authorizeRole('recruiter'),
  async (req, res, next) => {
    try {
      const company = await Company.findOne({ _id: req.params.id, recruiterId: req.user.id });
      if (!company) return res.status(404).json({ message: 'Company not found' });
      res.json({ company });
    } catch (err) {
      next(err);
    }
  }
);

// Update company
router.put(
  '/:id',
  verifyToken,
  authorizeRole('recruiter'),
  upload.single('companyLogo'),
  async (req, res, next) => {
    try {
      const { name, website, description, location, bio } = req.body;

      const update = {};
      if (name) update.name = name.trim();
      if (typeof website !== 'undefined') update.website = website?.trim();
      if (typeof description !== 'undefined') update.description = description;
      if (typeof location !== 'undefined') update.location = location?.trim();
      if (typeof bio !== 'undefined') update.bio = bio;
      if (req.file) update.logoUrl = `/uploads/${req.file.filename}`;

      const company = await Company.findOneAndUpdate(
        { _id: req.params.id, recruiterId: req.user.id },
        update,
        { new: true, runValidators: true, context: 'query' }
      );

      if (!company) return res.status(404).json({ message: 'Company not found' });

      res.json({ company });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

