const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { validateRequest } = require('../middleware/validate.middleware');
const {
  studentLogin, verifyOTP, adminLogin, registerStudent, resendOTP
} = require('../controllers/auth.controller');

router.post('/student/login',
  [
    body('phone').isMobilePhone().withMessage('Valid phone required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validateRequest, studentLogin
);

router.post('/student/verify-otp',
  [
    body('phone').isMobilePhone(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  validateRequest, verifyOTP
);

router.post('/student/resend-otp',
  [body('phone').isMobilePhone()],
  validateRequest, resendOTP
);

router.post('/student/register',
  [
    body('roll_no').notEmpty().withMessage('Roll number required'),
    body('name').notEmpty().withMessage('Name required'),
    body('phone').isMobilePhone().withMessage('Valid phone required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validateRequest, registerStudent
);

router.post('/admin/login',
  [
    body('phone').isMobilePhone(),
    body('password').notEmpty()
  ],
  validateRequest, adminLogin
);

module.exports = router;
