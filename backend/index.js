const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const jobRoutes = require('./routes/jobs');
const companyRoutes = require('./routes/companies');
const interviewQuestionRoutes = require('./routes/interviewQuestions');
const loginActivityRoutes = require('./routes/loginActivity');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5000"
  ],
  credentials: true
}));

// Ensure uploads directory exists and serve uploaded files statically
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', interviewQuestionRoutes);
app.use('/api/login-activity', loginActivityRoutes);

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 3000;

console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
