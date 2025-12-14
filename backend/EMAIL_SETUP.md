# Email Configuration Guide

This guide will help you set up email sending for the password reset feature.

## Quick Setup

Add these environment variables to your `backend/.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

## Option 1: Gmail (Recommended for Development)

### Steps:

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" and follow the setup

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Job Portal"
   - Copy the 16-character password (remove spaces)

3. **Add to .env file**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcdabcdabcdabcd  # 16-character app password
```

### Example .env Configuration:
```env
# Existing variables
MONGODB_URI=mongodb://localhost:27017/jobportal
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=abcdabcdabcdabcd
```

## Option 2: Mailtrap (For Testing - No Real Emails)

Perfect for development - captures all emails without sending them.

1. **Sign up**: https://mailtrap.io (Free account)
2. **Get credentials** from your inbox settings
3. **Add to .env**:
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

## Option 3: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@outlook.com
EMAIL_PASSWORD=your-password
```

## Option 4: Other SMTP Services

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-ses-username
EMAIL_PASSWORD=your-aws-ses-password
```

## Testing the Configuration

1. **Restart your backend server** after adding email configuration
2. **Check the console** for initialization message:
   - ✅ Success: "Email service initialized"
   - ⚠️ Warning: "Email credentials not configured"

3. **Test forgot password**:
   - Go to: http://localhost:3000/forgot-password
   - Enter a registered email
   - Check your email inbox for the reset code

## Troubleshooting

### "Email credentials not configured"
- Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Restart the backend server
- Check for typos in variable names

### "Failed to send email"
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Gmail**: Check if 2-Step Verification is enabled
- **All**: Verify `EMAIL_HOST` and `EMAIL_PORT` are correct
- **All**: Check if your firewall is blocking port 587 or 465

### Emails going to Spam
- Add a proper `from` email address
- Use a professional email domain
- Consider using SPF/DKIM records (production)

## Development Mode (No Email Configuration)

If you don't configure email credentials:
- The reset code will be **logged to the console**
- The code will also be **returned in the API response**
- Perfect for quick testing without email setup

## Production Recommendations

For production, consider using:
- **SendGrid** (12,000 free emails/month)
- **AWS SES** (very affordable, pay-as-you-go)
- **Mailgun** (good for high volume)
- **Postmark** (excellent deliverability)

Never use personal Gmail accounts in production!

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file to Git
- Never share your email passwords
- Use App Passwords for Gmail (never your main password)
- Rotate credentials regularly
- Use environment-specific configurations

## Example Complete .env File

```env
# Database
MONGODB_URI=mongodb://localhost:27017/jobportal

# Authentication
JWT_SECRET=my_super_secret_jwt_key_12345

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=myapp@gmail.com
EMAIL_PASSWORD=abcdabcdabcdabcd
```

## Support

If you encounter issues:
1. Check the backend console for error messages
2. Verify your email credentials
3. Try Mailtrap for testing first
4. Ensure your backend server is restarted after changes

