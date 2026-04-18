const express = require('express');
const router = express.Router();
const { authMiddleware, requireStudent } = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, getUnreadCount } = require('../controllers/notification.controller');

router.use(authMiddleware, requireStudent);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-read', markAsRead);

module.exports = router;
