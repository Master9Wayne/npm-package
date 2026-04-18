const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const {
  lookupStudent, getAdminProfile, getPlatforms, createPlatform, createAdmin
} = require('../controllers/admin.controller');

router.use(authMiddleware, requireAdmin);

router.get('/profile', getAdminProfile);
router.get('/lookup-student', lookupStudent);
router.get('/platforms', getPlatforms);

router.post('/platforms',
  [
    body('platform_id').notEmpty(),
    body('name').notEmpty(),
    body('location').notEmpty()
  ],
  validateRequest, createPlatform
);

router.post('/create-admin',
  [
    body('name').notEmpty(),
    body('phone').isMobilePhone(),
    body('password').isLength({ min: 6 })
  ],
  validateRequest, createAdmin
);

module.exports = router;
