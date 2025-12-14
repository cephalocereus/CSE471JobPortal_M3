const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  description: { type: String, trim: true },
  location: { type: String, trim: true },
  logoUrl: { type: String, trim: true },
  bio: { type: String, trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);

