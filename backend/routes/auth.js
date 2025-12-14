const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const { trackSuccessfulLogin, trackFailedLogin } = require('../services/loginTrackingService');

const router = express.Router();

const TOKEN_COOKIE_NAME = 'token';
const TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;
    console.log('📝 Register attempt:', { name, email, role, companyId });
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }
    if (!['applicant', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'role must be applicant or recruiter' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    // For recruiters, store companyId if provided (can be null for independent recruiters)
    const userData = { name, email, password, role };
    if (role === 'recruiter' && companyId !== undefined) {
      // If companyId is provided, validate it exists (unless it's null)
      if (companyId !== null && companyId !== '') {
        const Company = require('../models/Company');
        const company = await Company.findById(companyId);
        if (!company) {
          return res.status(400).json({ message: 'Invalid company selected' });
        }
        userData.companyId = companyId;
      } else {
        userData.companyId = null;
      }
    }

    const user = new User(userData);
    await user.save();
    console.log('✅ User registered:', user._id);

    const token = createToken(user);

    res.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: TOKEN_EXPIRES_MS
    });

    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('❌ Register error:', err.stack);
    return res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, testMode, simulatedCountry, simulatedIP, simulatedDevice } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    // Get client IP address (handle proxies and various configurations)
    let ipAddress = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] ||
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress ||
                    req.ip ||
                    '127.0.0.1';
    
    // If x-forwarded-for contains multiple IPs, get the first one (client IP)
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }
    
    // Clean up IPv6 localhost to IPv4
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1';
    }
    
    // Remove IPv6 prefix if present
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }
    
    console.log('🌐 Client IP Address:', ipAddress);
    
    // Get User-Agent
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const user = await User.findOne({ email });
    
    // Track failed login if user not found
    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    
    // Track failed login if password doesn't match
    if (!isMatch) {
      console.log('❌ Login failed: Invalid password');
      await trackFailedLogin(user._id, email, ipAddress, userAgent);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Successful login - track it with IPinfo API
    console.log('✅ Login successful, tracking activity...');
    const trackingResult = await trackSuccessfulLogin(user._id, ipAddress, userAgent, {
      testMode,
      simulatedCountry,
      simulatedIP,
      simulatedDevice
    });
    
    if (trackingResult.success) {
      console.log('✅ Login activity tracked successfully');
      if (trackingResult.suspiciousCheck.isSuspicious) {
        console.log('🚨 SUSPICIOUS LOGIN DETECTED!');
        console.log('Reasons:', trackingResult.suspiciousCheck.suspiciousReasons);
      }
    } else {
      console.warn('⚠️  Failed to track login activity:', trackingResult.error);
    }

    const token = createToken(user);
    res.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: TOKEN_EXPIRES_MS
    });

    const userObj = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role
    };
    
    // Include suspicious login warning in response if detected
    const response = { user: userObj };
    if (trackingResult.success && trackingResult.suspiciousCheck.isSuspicious) {
      response.suspiciousLogin = {
        detected: true,
        reasons: trackingResult.suspiciousCheck.suspiciousReasons,
        message: 'We detected unusual activity with this login. Please review your account security.'
      };
    }
    
    return res.status(200).json(response);
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
  return res.json({ message: 'Logged out' });
});

// Forgot Password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a password reset code.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character code
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send password reset email
    console.log('🔑 Password Reset Token for', email, ':', resetToken);
    
    try {
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        // Email sent successfully
        return res.status(200).json({ 
          message: 'Password reset code has been sent to your email address. Please check your inbox.',
          emailSent: true
        });
      } else {
        // Email service not configured or failed - return token for development
        console.log('⚠️  Email not sent. Returning token in response for development.');
        return res.status(200).json({ 
          message: 'Password reset code generated (Email service not configured)',
          resetToken, // For development/testing when email is not configured
          expiresIn: '15 minutes',
          emailSent: false,
          note: 'Configure EMAIL_USER and EMAIL_PASSWORD in .env to enable email sending'
        });
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Return token as fallback
      return res.status(200).json({ 
        message: 'Password reset code generated (Email sending failed)',
        resetToken, // Fallback for development
        expiresIn: '15 minutes',
        emailSent: false
      });
    }
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify Reset Token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
    
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    return res.status(200).json({ message: 'Token is valid', valid: true });
  } catch (err) {
    console.error('❌ Verify token error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
    
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', email);

    return res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;