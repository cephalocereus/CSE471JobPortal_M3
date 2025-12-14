const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  salary: { type: String, trim: true },
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
  experience: { type: String, trim: true }, // e.g., "2-3 years"
  skills: [{ type: String }],
  positions: { type: Number, default: 1, min: 1 },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
