const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getUserLoginHistory, getSuspiciousLogins } = require('../services/loginTrackingService');
const LoginActivity = require('../models/LoginActivity');

const router = express.Router();

/**
 * Get current user's login history
 * GET /api/login-activity/history
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const loginHistory = await getUserLoginHistory(req.user.id, limit);
    
    res.json({
      success: true,
      count: loginHistory.length,
      loginHistory
    });
  } catch (err) {
    console.error('Error fetching login history:', err);
    res.status(500).json({ message: 'Error fetching login history', error: err.message });
  }
});

/**
 * Get current user's suspicious logins
 * GET /api/login-activity/suspicious
 */
router.get('/suspicious', verifyToken, async (req, res) => {
  try {
    const suspiciousLogins = await getSuspiciousLogins(req.user.id);
    
    res.json({
      success: true,
      count: suspiciousLogins.length,
      suspiciousLogins
    });
  } catch (err) {
    console.error('Error fetching suspicious logins:', err);
    res.status(500).json({ message: 'Error fetching suspicious logins', error: err.message });
  }
});

/**
 * Get login statistics for current user
 * GET /api/login-activity/stats
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total logins
    const totalLogins = await LoginActivity.countDocuments({ 
      userId, 
      status: 'success' 
    });
    
    // Get suspicious logins count
    const suspiciousCount = await LoginActivity.countDocuments({ 
      userId, 
      isSuspicious: true,
      status: 'success'
    });
    
    // Get failed attempts count
    const failedAttempts = await LoginActivity.countDocuments({ 
      userId, 
      status: 'failed' 
    });
    
    // Get unique IPs
    const uniqueIPs = await LoginActivity.distinct('ipAddress', { 
      userId, 
      status: 'success' 
    });
    
    // Get unique countries
    const uniqueCountries = await LoginActivity.distinct('ipInfo.country', { 
      userId, 
      status: 'success',
      'ipInfo.country': { $ne: 'XX' }
    });
    
    // Get unique devices (browser + OS combinations)
    const logins = await LoginActivity.find({ 
      userId, 
      status: 'success' 
    }).select('device');
    
    const uniqueDevices = new Set();
    logins.forEach(login => {
      if (login.device.browser && login.device.os) {
        uniqueDevices.add(`${login.device.browser} on ${login.device.os}`);
      }
    });
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogins = await LoginActivity.countDocuments({
      userId,
      status: 'success',
      loginTime: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      success: true,
      stats: {
        totalLogins,
        suspiciousCount,
        failedAttempts,
        uniqueIPsCount: uniqueIPs.length,
        uniqueCountriesCount: uniqueCountries.length,
        uniqueDevicesCount: uniqueDevices.size,
        recentLoginsLast30Days: recentLogins,
        suspiciousRate: totalLogins > 0 ? ((suspiciousCount / totalLogins) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    console.error('Error fetching login stats:', err);
    res.status(500).json({ message: 'Error fetching login statistics', error: err.message });
  }
});

/**
 * Mark suspicious login as reviewed/acknowledged
 * PUT /api/login-activity/:id/acknowledge
 */
router.put('/:id/acknowledge', verifyToken, async (req, res) => {
  try {
    const loginActivity = await LoginActivity.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!loginActivity) {
      return res.status(404).json({ message: 'Login activity not found' });
    }
    
    loginActivity.isSuspicious = false;
    loginActivity.suspiciousReasons = [];
    await loginActivity.save();
    
    res.json({
      success: true,
      message: 'Login activity acknowledged',
      loginActivity
    });
  } catch (err) {
    console.error('Error acknowledging login:', err);
    res.status(500).json({ message: 'Error acknowledging login', error: err.message });
  }
});

module.exports = router;

