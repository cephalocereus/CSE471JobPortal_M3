# 🔐 Login Activity Tracker & Suspicious Login Detection System

## Overview

This system implements a comprehensive login activity tracking and suspicious login detection system using the IPinfo API. It monitors all login attempts, detects unusual patterns, and alerts users about suspicious activity.

## 🎯 Features Implemented

### 1. **IPinfo API Integration**
- Automatic IP geolocation on every login
- Captures: IP address, country, city, region, ISP/organization
- Handles local/private IPs gracefully
- Falls back to default data if API fails

### 2. **Login Activity Tracking**
- Stores every successful and failed login attempt
- Records timestamp, IP info, User-Agent details
- Parses browser, OS, and device information
- Links all activity to user accounts

### 3. **Suspicious Login Detection**
The system detects suspicious logins based on:
- ✅ **New IP Address** - First login from this IP
- ✅ **New Country** - First login from this country
- ✅ **New Device/Browser** - Different browser or OS combination
- ✅ **Unusual Login Time** - Login at unusual hours (based on user's pattern)
- ✅ **Multiple Failed Attempts** - 3+ failed logins in last 15 minutes

### 4. **Security Alerts**
- Flags suspicious logins in database
- Logs alerts to console
- Sends email notifications (if configured)
- Shows in-app warnings on login

### 5. **Test Mode (for Demonstration)**
- Simulate different countries without VPN
- Simulate different IP addresses
- Simulate different devices
- Perfect for academic presentations

### 6. **Login History Dashboard**
- View all login activities
- See statistics and patterns
- Filter by suspicious/normal logins
- Acknowledge/review suspicious activity

---

## 🚀 Getting Started

### Step 1: Get IPinfo API Token (Free)

1. **Sign up** at: https://ipinfo.io/signup
2. **Get your token** from the dashboard
3. **Add to `.env` file**:

```env
IPINFO_API_TOKEN=your_token_here
```

**Note:** Free tier includes:
- 50,000 requests/month
- Perfect for academic projects
- No credit card required

### Step 2: Backend is Already Set Up!

The system is fully integrated. Just make sure your `.env` has:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/jobportal

# JWT
JWT_SECRET=your_secret_key

# IPinfo API (Get free token from https://ipinfo.io)
IPINFO_API_TOKEN=your_token_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (Optional - for suspicious login alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Step 3: Restart Backend Server

```bash
cd backend
node index.js
```

You should see:
```
✅ Email service initialized (if configured)
Server running on port 5000
```

---

## 📋 How It Works

### Normal Login Flow:

1. **User logs in** with email/password
2. **Backend captures** IP address and User-Agent
3. **IPinfo API called** to get location data
4. **User-Agent parsed** to extract browser/OS
5. **Suspicious patterns checked**:
   - Compare with user's login history
   - Check for new IPs, countries, devices
   - Analyze login time patterns
   - Check for recent failed attempts
6. **Activity stored** in MongoDB
7. **Alert sent** if suspicious (email + console)
8. **User notified** via in-app warning
9. **Login completes** successfully

### Suspicious Login Detection Logic:

```javascript
// 1. New IP Address
- Check: Has user logged in from this IP before?
- If NO → Flag as suspicious

// 2. New Country
- Check: Has user logged in from this country before?
- If NO → Flag as suspicious

// 3. New Device
- Check: Has user used this browser+OS combination before?
- If NO → Flag as suspicious

// 4. Unusual Time
- Calculate: User's typical login hours (average + std deviation)
- Check: Is current hour > 2 std deviations from average?
- If YES → Flag as suspicious

// 5. Multiple Failed Attempts
- Count: Failed logins in last 15 minutes
- If >= 3 → Flag as suspicious
```

---

## 🧪 Testing the System

### Test 1: Normal Login (No Alerts)

1. Login with your account
2. Check backend console - you'll see:
```
✅ Login successful, tracking activity...
✅ IPinfo API response: { city: 'Dhaka', country: 'BD' }
✅ Login activity tracked successfully
```

3. Go to **"Login History"** in dashboard
4. See your login with all details

### Test 2: Simulate Suspicious Login (Test Mode)

1. Go to login page
2. Click **"🧪 Show Test Mode"**
3. Enter your credentials
4. Fill in test data:
   - **Simulated Country**: `US` (or any country you haven't logged in from)
   - **Simulated IP**: `8.8.8.8`
   - **Simulated Device**: `Firefox on Linux`
5. Click **"Login"**

**Expected Result:**
```
🚨 SUSPICIOUS LOGIN DETECTED!
Reasons: new_ip, new_country, new_device, test_mode_simulation
```

6. You'll see a warning message on screen
7. Check "Login History" - this login is marked as suspicious
8. Check backend console for detailed logs
9. Check email (if configured) for security alert

### Test 3: Multiple Failed Attempts

1. Try logging in with **wrong password** 3 times
2. Then login with **correct password**
3. Backend will detect:
```
🚨 Suspicious: Multiple failed attempts detected: 3
```

### Test 4: Unusual Login Time

1. Login at different times of day
2. After 5+ logins, system learns your pattern
3. Login at an unusual hour (e.g., 3 AM if you usually login at 2 PM)
4. System may flag it as suspicious

---

## 📊 Viewing Login History

### Access Login History:

1. **Login** to your account
2. Click **"Login History"** button in navbar
3. Or navigate to: `/login-history`

### What You'll See:

**Statistics Cards:**
- Total Logins
- Suspicious Logins (with percentage)
- Failed Attempts
- Unique Devices
- Unique IPs
- Countries

**Filters:**
- All logins
- Suspicious only
- Normal only

**Login Details for Each Entry:**
- Time and date
- Location (city, country)
- IP address
- Device (browser and OS)
- ISP/Organization
- Suspicious indicators (if any)
- Alert status

### Actions Available:
- **Mark as Reviewed** - Acknowledge suspicious logins
- **Filter** - View specific types of logins
- **Real-time Stats** - See your security overview

---

## 🔧 API Endpoints

### Login Activity Endpoints:

```javascript
// Get login history
GET /api/login-activity/history?limit=50

// Get suspicious logins only
GET /api/login-activity/suspicious

// Get login statistics
GET /api/login-activity/stats

// Acknowledge suspicious login
PUT /api/login-activity/:id/acknowledge
```

---

## 📧 Email Alerts

When a suspicious login is detected, users receive:

**Email includes:**
- Security alert header
- Login timestamp
- IP address and location
- Device information
- ISP details
- List of suspicious indicators
- Action buttons ("Secure My Account")
- Instructions on what to do

**Email Configuration:**

See `EMAIL_SETUP.md` for full email configuration guide.

---

## 🗄️ Database Schema

### LoginActivity Model:

```javascript
{
  userId: ObjectId,              // Reference to User
  status: 'success' | 'failed',  // Login status
  isSuspicious: Boolean,          // Suspicious flag
  suspiciousReasons: [String],    // Array of reasons
  
  // IP Information from IPinfo
  ipAddress: String,
  ipInfo: {
    city: String,
    region: String,
    country: String,              // 'US', 'BD', etc.
    countryName: String,          // Full name
    loc: String,                  // Lat/Long
    org: String,                  // ISP
    postal: String,
    timezone: String
  },
  
  // Device Information
  userAgent: String,
  device: {
    browser: String,              // Chrome, Firefox, etc.
    browserVersion: String,
    os: String,                   // Windows, macOS, Linux
    osVersion: String,
    device: String,               // Desktop, Mobile
    deviceVendor: String,
    deviceModel: String
  },
  
  // Time Information
  loginTime: Date,
  loginHour: Number,              // 0-23
  
  // Test Mode
  isTestMode: Boolean,
  testModeData: {
    simulatedCountry: String,
    simulatedIP: String,
    simulatedDevice: String,
    notes: String
  },
  
  // Alerts
  alertSent: Boolean,
  alertSentAt: Date,
  
  timestamps: true                // createdAt, updatedAt
}
```

---

## 🎓 Academic Project Notes

This implementation is perfect for academic projects because:

### 1. **Real API Integration**
- Uses actual IPinfo API (not mocked)
- Demonstrates real-world API usage
- Shows proper error handling

### 2. **Test Mode for Demonstrations**
- No VPN needed to demo suspicious logins
- Simulate any scenario instantly
- Perfect for presentations
- Shows "what-if" scenarios

### 3. **Well-Documented Code**
- Every function has comments
- Clear variable names
- Follows best practices
- Easy to understand

### 4. **Complete Features**
- Database integration (MongoDB)
- API integration (IPinfo)
- Email notifications
- Frontend dashboard
- Statistical analysis

### 5. **Security Best Practices**
- Hashes are not stored (only derived data)
- Secure session handling
- Privacy-conscious logging
- GDPR-friendly

---

## 🐛 Troubleshooting

### "API Error" in console

**Problem:** IPinfo API calls failing

**Solutions:**
1. Check if `IPINFO_API_TOKEN` is set in `.env`
2. Verify token is valid at https://ipinfo.io
3. Check if you've exceeded free tier limit (50k/month)
4. System will work anyway (uses fallback data)

### No location data showing

**Problem:** Local IP addresses (127.0.0.1, ::1)

**Solution:** 
- This is normal for localhost testing
- Uses default "Local Network" data
- Use Test Mode to simulate real IPs

### Suspicious flags not appearing

**Problem:** All logins from same IP/device

**Solutions:**
1. Use **Test Mode** to simulate different conditions
2. Try from mobile device
3. Try from different browser
4. Trigger multiple failed attempts first

### Email alerts not sending

**Problem:** Email service not configured

**Solutions:**
1. See `EMAIL_SETUP.md` for configuration
2. Check `EMIL_USER` and `EMAIL_PASSWORD` in `.env`
3. System still works without email (console logs instead)

---

## 📈 Statistics & Analytics

The system tracks:

- **Total logins** per user
- **Suspicious login rate** (percentage)
- **Failed attempt count**
- **Unique IP addresses** used
- **Unique countries** logged in from
- **Unique devices/browsers** used
- **Recent activity** (last 30 days)
- **Login time patterns** (hourly distribution)

All statistics are available via the frontend dashboard and API endpoints.

---

## 🔒 Security Features

1. **Privacy-Focused**
   - Only stores necessary data
   - IP addresses can be deleted
   - User controls their data

2. **Real-Time Detection**
   - Immediate analysis on login
   - No delay in alerts
   - Instant notifications

3. **Historical Analysis**
   - Learns user patterns over time
   - Improves detection accuracy
   - Reduces false positives

4. **User-Friendly**
   - Clear explanations
   - Easy to review activity
   - Simple acknowledgment process

---

## 🎉 Success Indicators

You'll know the system is working when:

1. ✅ Backend logs show IPinfo API responses
2. ✅ Login history page displays all logins
3. ✅ Statistics cards show accurate counts
4. ✅ Test mode triggers suspicious flags
5. ✅ Email alerts sent (if configured)
6. ✅ In-app warnings appear for suspicious logins
7. ✅ Database contains LoginActivity documents

---

## 📝 Files Created/Modified

### Backend:
- `models/LoginActivity.js` - Database schema
- `services/loginTrackingService.js` - Core logic & IPinfo integration
- `services/emailService.js` - Added suspicious login alerts
- `routes/loginActivity.js` - API endpoints
- `routes/auth.js` - Updated login endpoint
- `index.js` - Added routes

### Frontend:
- `components/LoginHistory.js` - Dashboard component
- `components/Login.js` - Added test mode & warnings
- `styles/LoginHistory.css` - Styling
- `styles/Auth.css` - Updated for test mode
- `api.js` - Added login activity endpoints
- `AuthContext.js` - Updated login function
- `App.js` - Added route
- Both dashboards - Added navigation links

---

## 🎯 Next Steps (Optional Enhancements)

1. **Two-Factor Authentication** - Add 2FA for high-risk logins
2. **IP Whitelist** - Allow users to whitelist trusted IPs
3. **Auto-Block** - Temporarily block after multiple suspicious logins
4. **Export History** - Download login history as CSV/PDF
5. **Advanced Analytics** - More detailed patterns and graphs
6. **Mobile App Notifications** - Push notifications for suspicious logins

---

## 📚 References

- **IPinfo API Docs**: https://ipinfo.io/developers
- **ua-parser-js**: https://github.com/faisalman/ua-parser-js
- **Node-ipinfo**: https://github.com/ipinfo/node
- **MongoDB Docs**: https://docs.mongodb.com

---

## ✅ Checklist for Testing/Demo

- [ ] IPinfo API token configured
- [ ] Backend server running
- [ ] Frontend server running
- [ ] MongoDB connected
- [ ] Login with normal credentials
- [ ] Check login history page
- [ ] Try test mode with simulated data
- [ ] Verify suspicious flags appear
- [ ] Check backend console logs
- [ ] Review email alerts (if configured)
- [ ] Test failed login attempts
- [ ] Review statistics dashboard

---

**System Status:** ✅ Fully Operational
**Last Updated:** December 2024
**Version:** 1.0.0

For questions or issues, check the console logs first - they contain detailed information about what's happening!

