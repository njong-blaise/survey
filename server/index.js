const express = require('express');
const cors = require('cors');
require('dotenv').config();

const surveyRoutes = require('./routes/surveyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: This origin is not allowed'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Survey Application API Server' });
});

// API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Survey Application API',
    availableRoutes: [
      'GET /api/surveys - Get all surveys (authenticated)',
      'POST /api/surveys - Create survey (authenticated)',
      'GET /api/surveys/:id - Get survey by ID (authenticated)',
      'PUT /api/surveys/:id - Update survey (authenticated)',
      'DELETE /api/surveys/:id - Delete survey (authenticated)',
      'GET /api/surveys/public/:id - Get public survey',
      'POST /api/responses/survey/:id - Submit survey response',
      'GET /api/responses/survey/:id/responses - Get survey responses (authenticated)',
      'GET /api/responses/survey/:id/analytics - Get survey analytics (authenticated)',
      'GET /api/admin/users - Get all users (admin)',
      'PUT /api/admin/users/:userId/role - Update user role (super admin)',
      'GET /api/admin/surveys - Get all surveys with details (admin)',
      'DELETE /api/admin/surveys/:surveyId - Delete any survey (super admin)',
      'GET /api/admin/responses - Get all responses (super admin)',
      'GET /api/admin/questions - Get all questions (super admin)',
      'GET /api/admin/activity - Get admin activity log (admin)',
      'GET /api/admin/stats - Get comprehensive system statistics (admin)',
      'GET /api/admin/profile - Get admin profile (admin)'
    ]
  });
});

app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
