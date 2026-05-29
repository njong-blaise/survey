const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  submitResponse,
  getSurveyResponses,
  getSurveyAnalytics
} = require('../controllers/responseController');

const router = express.Router();

// Public route for submitting responses
router.post('/survey/:surveyId', submitResponse);

// Protected routes (require authentication)
router.use(authenticateToken);

// Response analytics and management
router.get('/survey/:surveyId/responses', getSurveyResponses);
router.get('/survey/:surveyId/analytics', getSurveyAnalytics);

module.exports = router;
