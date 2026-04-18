const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db.config');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Student token
    if (decoded.roll_no) {
      const student = await prisma.student.findUnique({
        where: { roll_no: decoded.roll_no },
        select: { roll_no: true, name: true, hostel_id: true }
      });
      if (!student) return res.status(401).json({ error: 'Invalid token' });
      req.student = student;
      req.userType = 'student';
    }
    // Admin token
    else if (decoded.admin_id) {
      const admin = await prisma.admin.findUnique({
        where: { admin_id: decoded.admin_id },
        select: { admin_id: true, name: true }
      });
      if (!admin) return res.status(401).json({ error: 'Invalid token' });
      req.admin = admin;
      req.userType = 'admin';
    } else {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireStudent(req, res, next) {
  if (req.userType !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, requireStudent, requireAdmin };
