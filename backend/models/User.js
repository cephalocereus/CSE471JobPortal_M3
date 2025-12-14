const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['applicant', 'recruiter'], required: true },

  // Applicant profile fields
  phoneNumber: { type: String, trim: true },
  bio: { type: String, trim: true },
  skills: {
    type: [String],
    default: [],
    set: (skills = []) =>
      skills
        .map(skill => skill?.toString().trim())
        .filter(Boolean)
  },
  avatarUrl: { type: String, trim: true },
  resumeUrl: { type: String, trim: true },

  // Recruiter company profile fields
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  companyName: { type: String, trim: true },
  companyWebsite: { type: String, trim: true },
  companyDescription: { type: String, trim: true },
  companyLocation: { type: String, trim: true },
  companyLogoUrl: { type: String, trim: true },

  // Recommendation related data
  profileKeywords: {
    type: [String],
    default: [],
    set: (keywords = []) =>
      keywords
        .map(keyword => keyword?.toString().trim())
        .filter(Boolean)
  },
  searchHistory: [{
    term: { type: String, trim: true },
    searchedAt: { type: Date, default: Date.now }
  }],

  // Saved/Wishlist jobs
  savedJobs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Job',
    default: []
  },

  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);