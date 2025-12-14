const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: String }, // URL or file path to resume
  coverLetter: { type: String },
  skills: [{ type: String }], // Array of skills
  experience: { type: String }, // Years of experience
  status: { type: String, enum: ['Applied', 'Reviewed', 'Accepted', 'Rejected'], default: 'Applied' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);
