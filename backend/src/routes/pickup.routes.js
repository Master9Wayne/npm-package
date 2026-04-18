const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware, requireStudent } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const {
  authorizePickup, respondPickupAuth, getPickupAuths, revokePickupAuth
} = require('../controllers/pickup.controller');

router.use(authMiddleware, requireStudent);

router.post('/authorize',
  [
    body('package_id').notEmpty().withMessage('Package ID required'),
    body('friend_roll_no').notEmpty().withMessage('Friend roll number required'),
    body('expires_hours').optional().isInt({ min: 1, max: 168 })
  ],
  validateRequest, authorizePickup
);

router.get('/list', getPickupAuths);
router.patch('/respond/:auth_id',
  [body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline')],
  validateRequest, respondPickupAuth
);
router.delete('/revoke/:auth_id', revokePickupAuth);

module.exports = router;
