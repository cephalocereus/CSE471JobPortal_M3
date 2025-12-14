const mongoose = require('mongoose');

const interviewQuestionRepositorySchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  questions: [{ type: String, trim: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Ensure one repository per job
interviewQuestionRepositorySchema.index({ jobId: 1 }, { unique: true });

module.exports = mongoose.model('InterviewQuestionRepository', interviewQuestionRepositorySchema);

