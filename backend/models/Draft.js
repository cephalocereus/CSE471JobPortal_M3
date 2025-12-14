const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  applicantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // For faster queries
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true,
    index: true
  },
  formData: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    coverLetter: { type: String, default: '' },
    skills: { type: String, default: '' },
    experience: { type: String, default: '' },
    resumeFileName: { type: String, default: '' } // Store filename only, not file itself
  },
  lastSaved: { 
    type: Date, 
    default: Date.now,
    index: true // For cleanup queries
  }
}, {
  timestamps: true
});

// Compound index to ensure one draft per user per job
draftSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Draft', draftSchema);

