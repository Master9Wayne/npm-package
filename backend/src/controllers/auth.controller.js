const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db.config');
const { sendOTP } = require('../utils/twilio.utils');
const { generateOTP } = require('../utils/otp.utils');

// Student login
async function studentLogin(req, res) {
  try {
    const { phone, password } = req.body;

    const student = await prisma.student.findUnique({ where: { phone } });
    if (!student) return res.status(401).json({ error: 'Invalid credentials' });

    const validPass = await bcrypt.compare(password, student.password_hash);
    if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if OTP required (not logged in for 30+ days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const otpRequired = !student.last_login || student.last_login < thirtyDaysAgo;

    if (otpRequired) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

      await prisma.student.update({
        where: { phone },
        data: { otp, otp_expiry: otpExpiry }
      });

      await sendOTP(phone, otp);
      return res.json({ otpRequired: true, message: 'OTP sent to your phone' });
    }

    // Direct login
    await prisma.student.update({
      where: { phone },
      data: { last_login: new Date(), otp: null, otp_expiry: null }
    });

    const token = jwt.sign(
      { roll_no: student.roll_no },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      token,
      student: { roll_no: student.roll_no, name: student.name, phone: student.phone }
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Verify OTP
async function verifyOTP(req, res) {
  try {
    const { phone, otp } = req.body;

    const student = await prisma.student.findUnique({ where: { phone } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!student.otp || student.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (student.otp_expiry < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    await prisma.student.update({
      where: { phone },
      data: { last_login: new Date(), otp: null, otp_expiry: null }
    });

    const token = jwt.sign(
      { roll_no: student.roll_no },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      student: { roll_no: student.roll_no, name: student.name, phone: student.phone }
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
}

// Admin login
async function adminLogin(req, res) {
  try {
    const { phone, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const validPass = await bcrypt.compare(password, admin.password_hash);
    if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { admin_id: admin.admin_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      admin: { admin_id: admin.admin_id, name: admin.name, phone: admin.phone }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Register student
async function registerStudent(req, res) {
  try {
    const { roll_no, name, phone, password, room_no, hostel_id } = req.body;

    const existing = await prisma.student.findFirst({
      where: { OR: [{ roll_no }, { phone }] }
    });
    if (existing) return res.status(409).json({ error: 'Student already exists' });

    const password_hash = await bcrypt.hash(password, 12);

    const student = await prisma.student.create({
      data: { roll_no, name, phone, password_hash, room_no, hostel_id: hostel_id ? parseInt(hostel_id) : null }
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: { roll_no: student.roll_no, name: student.name }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Resend OTP
async function resendOTP(req, res) {
  try {
    const { phone } = req.body;
    const student = await prisma.student.findUnique({ where: { phone } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    await prisma.student.update({
      where: { phone },
      data: { otp, otp_expiry: otpExpiry }
    });

    await sendOTP(phone, otp);
    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
}

module.exports = { studentLogin, verifyOTP, adminLogin, registerStudent, resendOTP };
