const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db.config');

async function lookupStudent(req, res) {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const student = await prisma.student.findUnique({
      where: { phone },
      select: {
        roll_no: true, name: true, phone: true, room_no: true,
        hostel: { select: { name: true } },
        packages: { where: { status: 'PENDING' }, take: 5 }
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
}

async function getAdminProfile(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { admin_id: req.admin.admin_id },
      select: { admin_id: true, name: true, phone: true, created_at: true }
    });
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function getPlatforms(req, res) {
  try {
    const platforms = await prisma.ecommercePlatform.findMany();
    res.json({ platforms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
}

async function createPlatform(req, res) {
  try {
    const { platform_id, name, location } = req.body;
    const platform = await prisma.ecommercePlatform.create({
      data: { platform_id, name, location }
    });
    res.status(201).json({ platform });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create platform' });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, phone, password } = req.body;
    const password_hash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({ data: { name, phone, password_hash } });
    res.status(201).json({ admin: { admin_id: admin.admin_id, name: admin.name } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
}

module.exports = { lookupStudent, getAdminProfile, getPlatforms, createPlatform, createAdmin };
