const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware, requireStudent, requireAdmin } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const {
  getStudentPackages, getPackageDetail, logPackageArrival,
  adminGetPackages, markPackageCollected, getAdminStats
} = require('../controllers/package.controller');

// Student routes
router.get('/my', authMiddleware, requireStudent, getStudentPackages);
router.get('/detail/:packageId', authMiddleware, getPackageDetail);

// Admin routes
router.post('/log',
  authMiddleware, requireAdmin,
  [
    body('student_phone').isMobilePhone().withMessage('Valid phone required'),
  ],
  validateRequest, logPackageArrival
);

router.get('/admin/all', authMiddleware, requireAdmin, adminGetPackages);
router.get('/admin/stats', authMiddleware, requireAdmin, getAdminStats);
router.patch('/admin/:packageId/collect', authMiddleware, requireAdmin, markPackageCollected);

module.exports = router;
