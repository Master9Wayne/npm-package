const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware, requireStudent } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const {
  searchStudents, sendFriendRequest, respondFriendRequest,
  getFriends, getPendingRequests, removeFriend
} = require('../controllers/friend.controller');

router.use(authMiddleware, requireStudent);

router.get('/search', searchStudents);
router.get('/list', getFriends);
router.get('/requests/pending', getPendingRequests);

router.post('/request',
  [body('receiver_roll_no').notEmpty().withMessage('Receiver roll number required')],
  validateRequest, sendFriendRequest
);

router.patch('/request/:friendship_id',
  [body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline')],
  validateRequest, respondFriendRequest
);

router.delete('/:friendship_id', removeFriend);

module.exports = router;
