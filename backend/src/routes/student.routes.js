const express = require('express');
const router = express.Router();
const { authMiddleware, requireStudent } = require('../middleware/auth.middleware');
const { getProfile, getHostels, getDashboardStats } = require('../controllers/student.controller');

router.get('/hostels', getHostels);
router.get('/profile', authMiddleware, requireStudent, getProfile);
router.get('/dashboard-stats', authMiddleware, requireStudent, getDashboardStats);

module.exports = router;
