const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getPublicSurvey
} = require('../controllers/surveyController');

const router = express.Router();

// Public routes
router.get('/public/:id', getPublicSurvey);

// Protected routes (require authentication)
router.use(authenticateToken);

// Survey CRUD operations
router.get('/', getSurveys);
router.get('/:id', getSurvey);
router.post('/', createSurvey);
router.put('/:id', updateSurvey);
router.delete('/:id', deleteSurvey);

module.exports = router;
