const { prisma } = require('../config/db.config');

async function getProfile(req, res) {
  try {
    const student = await prisma.student.findUnique({
      where: { roll_no: req.student.roll_no },
      select: {
        roll_no: true, name: true, phone: true,
        room_no: true, last_login: true,
        hostel: { select: { name: true, address: true } }
      }
    });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function getHostels(req, res) {
  try {
    const hostels = await prisma.hostel.findMany();
    res.json({ hostels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const { roll_no } = req.student;

    const [pending, collected, overdue, unreadNotifs] = await Promise.all([
      prisma.package.count({ where: { roll_no, status: 'PENDING' } }),
      prisma.package.count({ where: { roll_no, status: 'COLLECTED' } }),
      prisma.package.count({ where: { roll_no, status: 'OVERDUE' } }),
      prisma.notification.count({ where: { roll_no, is_read: false } })
    ]);

    const upcomingDeadlines = await prisma.package.findMany({
      where: {
        roll_no,
        status: 'PENDING',
        pickup_deadline: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { pickup_deadline: 'asc' },
      take: 3
    });

    res.json({ stats: { pending, collected, overdue, unreadNotifs }, upcomingDeadlines });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = { getProfile, getHostels, getDashboardStats };
