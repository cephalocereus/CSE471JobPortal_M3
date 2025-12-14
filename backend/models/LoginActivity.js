const mongoose = require('mongoose');

/**
 * LoginActivity Model
 * Tracks all login attempts (successful and failed) with IP geolocation data
 * Used for security monitoring and suspicious login detection
 */
const loginActivitySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  // Login Status
  status: { 
    type: String, 
    enum: ['success', 'failed'], 
    required: true,
    index: true
  },
  
  isSuspicious: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  suspiciousReasons: [{
    type: String,
    enum: [
      'new_ip',
      'new_country', 
      'new_browser',
      'new_os',
      'unusual_time',
      'multiple_failed_attempts',
      'new_device',
      'test_mode_simulation'
    ]
  }],
  
  // IP Information from IPinfo API
  ipAddress: { 
    type: String, 
    required: true,
    index: true
  },
  
  ipInfo: {
    city: String,
    region: String,
    country: String,           // Country code (e.g., 'US', 'BD')
    countryName: String,       // Full country name
    loc: String,               // Latitude/Longitude
    org: String,               // ISP/Organization
    postal: String,
    timezone: String
  },
  
  // User-Agent Information
  userAgent: { 
    type: String, 
    required: true 
  },
  
  // Parsed Device Information
  device: {
    browser: String,           // Chrome, Firefox, Safari, etc.
    browserVersion: String,
    os: String,                // Windows, macOS, Linux, Android, iOS
    osVersion: String,
    device: String,            // Desktop, Mobile, Tablet
    deviceVendor: String,
    deviceModel: String
  },
  
  // Login Timestamp
  loginTime: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  loginHour: {
    type: Number,              // 0-23, for unusual time detection
    min: 0,
    max: 23
  },
  
  // Failed Login Tracking
  failedAttempts: {
    type: Number,
    default: 0
  },
  
  // Test Mode Flag (for development/demonstration)
  isTestMode: {
    type: Boolean,
    default: false
  },
  
  testModeData: {
    simulatedCountry: String,
    simulatedIP: String,
    simulatedDevice: String,
    notes: String
  },
  
  // Notification Status
  alertSent: {
    type: Boolean,
    default: false
  },
  
  alertSentAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
loginActivitySchema.index({ userId: 1, loginTime: -1 });
loginActivitySchema.index({ userId: 1, isSuspicious: 1 });
loginActivitySchema.index({ ipAddress: 1, userId: 1 });

// Static method to get user's login history
loginActivitySchema.statics.getUserLoginHistory = function(userId, limit = 50) {
  return this.find({ userId, status: 'success' })
    .sort({ loginTime: -1 })
    .limit(limit);
};

// Static method to get suspicious logins for a user
loginActivitySchema.statics.getSuspiciousLogins = function(userId) {
  return this.find({ userId, isSuspicious: true, status: 'success' })
    .sort({ loginTime: -1 });
};

// Static method to get recent failed attempts
loginActivitySchema.statics.getRecentFailedAttempts = function(userId, minutes = 15) {
  const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
  return this.countDocuments({
    userId,
    status: 'failed',
    loginTime: { $gte: timeThreshold }
  });
};

// Method to check if this is first login from this IP
loginActivitySchema.statics.isNewIP = async function(userId, ipAddress) {
  const count = await this.countDocuments({
    userId,
    ipAddress,
    status: 'success'
  });
  return count === 0;
};

// Method to check if this is first login from this country
loginActivitySchema.statics.isNewCountry = async function(userId, country) {
  if (!country) return false;
  const count = await this.countDocuments({
    userId,
    'ipInfo.country': country,
    status: 'success'
  });
  return count === 0;
};

// Method to check if this browser/OS combination is new
loginActivitySchema.statics.isNewDevice = async function(userId, browser, os) {
  const count = await this.countDocuments({
    userId,
    'device.browser': browser,
    'device.os': os,
    status: 'success'
  });
  return count === 0;
};

// Method to get user's typical login hours
loginActivitySchema.statics.getUserTypicalLoginHours = async function(userId) {
  const logins = await this.find({ 
    userId, 
    status: 'success',
    loginHour: { $exists: true }
  }).select('loginHour');
  
  const hours = logins.map(l => l.loginHour);
  if (hours.length < 5) return null; // Need at least 5 logins to determine pattern
  
  // Calculate average and standard deviation
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
  const variance = hours.reduce((sum, hour) => sum + Math.pow(hour - avg, 2), 0) / hours.length;
  const stdDev = Math.sqrt(variance);
  
  return { average: avg, stdDeviation: stdDev, hoursSample: hours };
};

module.exports = mongoose.model('LoginActivity', loginActivitySchema);

