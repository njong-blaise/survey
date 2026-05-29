const express = require('express');
const router = express.Router();
const {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  logAdminActivity
} = require('../middleware/adminAuth');
const {
  getAllUsers,
  updateUserRole,
  getAllSurveys,
  deleteAnySurvey,
  getActivityLog,
  getAllResponses,
  getAllQuestions,
  getSystemStats,
  managePermissions
} = require('../controllers/adminController');

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// User Management Routes
router.get('/users', 
  requirePermission('view_all_users'),
  logAdminActivity('USERS_VIEWED'),
  getAllUsers
);

router.put('/users/:userId/role',
  requireSuperAdmin,
  logAdminActivity('USER_ROLE_UPDATED', 'user'),
  updateUserRole
);

router.put('/users/:userId/permissions',
  requireSuperAdmin,
  logAdminActivity('PERMISSIONS_UPDATED', 'user'),
  managePermissions
);

// Survey Management Routes
router.get('/surveys',
  requirePermission('view_all_surveys'),
  logAdminActivity('SURVEYS_VIEWED'),
  getAllSurveys
);

router.delete('/surveys/:surveyId',
  requireSuperAdmin,
  logAdminActivity('SURVEY_DELETED', 'survey'),
  deleteAnySurvey
);

// Response Management Routes (Super Admin Only)
router.get('/responses',
  requireSuperAdmin,
  logAdminActivity('RESPONSES_VIEWED'),
  getAllResponses
);

// Question Management Routes (Super Admin Only)
router.get('/questions',
  requireSuperAdmin,
  logAdminActivity('QUESTIONS_VIEWED'),
  getAllQuestions
);

// Activity Log Routes
router.get('/activity',
  requirePermission('system_admin'),
  getActivityLog
);

// System Statistics Routes
router.get('/stats',
  requirePermission('system_admin'),
  getSystemStats
);

// Admin Profile Routes
router.get('/profile', (req, res) => {
  res.json({
    user: req.user,
    permissions: req.user.role === 'super_admin' ? 
      ['view_all_surveys', 'manage_all_surveys', 'view_all_users', 'manage_users', 'system_admin'] :
      ['view_all_surveys'] // Basic admin permissions
  });
});

// Health check for admin panel
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
