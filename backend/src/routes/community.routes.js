const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware, requireStudent } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { getFriendsPackagesToday, toggleCommunityOptIn } = require('../controllers/community.controller');

router.use(authMiddleware, requireStudent);

router.get('/friends-packages-today', getFriendsPackagesToday);
router.post('/opt-in',
  [body('opt_in').isBoolean().withMessage('opt_in must be boolean')],
  validateRequest, toggleCommunityOptIn
);

module.exports = router;
