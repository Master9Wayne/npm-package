const { prisma } = require('../config/db.config');
const { createNotification } = require('../utils/notification.utils');
const { v4: uuidv4 } = require('uuid');

// Get all packages for a student
async function getStudentPackages(req, res) {
  try {
    const { roll_no } = req.student;
    const { status } = req.query;

    const where = { roll_no };
    if (status) where.status = status.toUpperCase();

    const packages = await prisma.package.findMany({
      where,
      include: {
        platform: true,
        pickup_auths: {
          include: { friend: { select: { name: true, roll_no: true } } },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { arrival_datetime: 'desc' }
    });

    res.json({ packages });
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
}

// Get single package detail
async function getPackageDetail(req, res) {
  try {
    const { packageId } = req.params;
    const roll_no = req.student?.roll_no;

    const pkg = await prisma.package.findUnique({
      where: { package_id: packageId },
      include: {
        platform: true,
        student: { select: { name: true, roll_no: true, room_no: true } },
        pickup_auths: {
          include: {
            friend: { select: { name: true, roll_no: true, phone: true } }
          },
          orderBy: { created_at: 'desc' }
        },
        notifications: { orderBy: { sent_at: 'desc' }, take: 5 }
      }
    });

    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    // Students can only see their own packages
    if (roll_no && pkg.roll_no !== roll_no) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ package: pkg });
  } catch (err) {
    console.error('Get package detail error:', err);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
}

// Admin: Log new package arrival
async function logPackageArrival(req, res) {
  try {
    const { student_phone, platform_id, description, pickup_deadline_days } = req.body;
    const admin_id = req.admin.admin_id;

    const student = await prisma.student.findUnique({ where: { phone: student_phone } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const deadlineDays = pickup_deadline_days || parseInt(process.env.PICKUP_DEADLINE_DAYS || 7);
    const pickup_deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);
    const package_id = `PKG-${uuidv4().substring(0, 8).toUpperCase()}`;

    const pkg = await prisma.package.create({
      data: {
        package_id,
        roll_no: student.roll_no,
        platform_id: platform_id || null,
        status: 'PENDING',
        pickup_deadline,
        logged_by_admin: admin_id,
        description: description || null
      },
      include: { platform: true, student: true }
    });

    // Create arrival notification
    await createNotification({
      roll_no: student.roll_no,
      package_id: pkg.package_id,
      type: 'ARRIVAL',
      message: `Your package ${package_id} has arrived! Pickup deadline: ${pickup_deadline.toLocaleDateString()}`
    });

    res.status(201).json({ message: 'Package logged successfully', package: pkg });
  } catch (err) {
    console.error('Log package error:', err);
    res.status(500).json({ error: 'Failed to log package' });
  }
}

// Admin: Get all packages with filters
async function adminGetPackages(req, res) {
  try {
    const { status, hostel_id, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (hostel_id) where.student = { hostel_id: parseInt(hostel_id) };
    if (search) {
      where.OR = [
        { package_id: { contains: search } },
        { student: { name: { contains: search } } },
        { student: { roll_no: { contains: search } } }
      ];
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          student: { select: { name: true, roll_no: true, phone: true, room_no: true, hostel: true } },
          platform: true,
          admin: { select: { name: true } }
        },
        orderBy: { arrival_datetime: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.package.count({ where })
    ]);

    res.json({ packages, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Admin get packages error:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
}

// Admin: Mark package as collected
async function markPackageCollected(req, res) {
  try {
    const { packageId } = req.params;
    const { collected_by_roll_no } = req.body;

    const pkg = await prisma.package.findUnique({ where: { package_id: packageId } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const updated = await prisma.package.update({
      where: { package_id: packageId },
      data: {
        status: 'COLLECTED',
        delivered_at: new Date(),
        delivered_to: collected_by_roll_no || pkg.roll_no
      }
    });

    // Notify the student
    if (collected_by_roll_no && collected_by_roll_no !== pkg.roll_no) {
      await createNotification({
        roll_no: pkg.roll_no,
        package_id: pkg.package_id,
        type: 'PICKUP_CONFIRMED',
        message: `Your package ${packageId} has been collected by your authorized friend.`
      });
    }

    // Mark pickup auth as used if applicable
    await prisma.pickupAuth.updateMany({
      where: { package_id: packageId, status: 'ACCEPTED' },
      data: { status: 'USED' }
    });

    res.json({ message: 'Package marked as collected', package: updated });
  } catch (err) {
    console.error('Mark collected error:', err);
    res.status(500).json({ error: 'Failed to update package' });
  }
}

// Admin stats
async function getAdminStats(req, res) {
  try {
    const [total, pending, collected, overdue, returning] = await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: 'PENDING' } }),
      prisma.package.count({ where: { status: 'COLLECTED' } }),
      prisma.package.count({ where: { status: 'OVERDUE' } }),
      prisma.package.count({ where: { status: 'RETURNING' } })
    ]);

    const recentPackages = await prisma.package.findMany({
      take: 5,
      orderBy: { arrival_datetime: 'desc' },
      include: { student: { select: { name: true, roll_no: true } } }
    });

    res.json({ stats: { total, pending, collected, overdue, returning }, recentPackages });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = {
  getStudentPackages,
  getPackageDetail,
  logPackageArrival,
  adminGetPackages,
  markPackageCollected,
  getAdminStats
};
