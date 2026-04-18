const { prisma } = require('../config/db.config');

// Get notifications for student
async function getNotifications(req, res) {
  try {
    const { roll_no } = req.student;
    const { unread_only = false, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { roll_no };
    if (unread_only === 'true') where.is_read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { package: { select: { package_id: true, status: true } } },
        orderBy: { sent_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { roll_no, is_read: false } })
    ]);

    res.json({ notifications, total, unreadCount, page: parseInt(page) });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// Mark notification(s) as read
async function markAsRead(req, res) {
  try {
    const { roll_no } = req.student;
    const { notif_ids, mark_all = false } = req.body;

    if (mark_all) {
      await prisma.notification.updateMany({
        where: { roll_no, is_read: false },
        data: { is_read: true }
      });
    } else if (notif_ids && notif_ids.length > 0) {
      await prisma.notification.updateMany({
        where: { notif_id: { in: notif_ids }, roll_no },
        data: { is_read: true }
      });
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
}

// Get unread count
async function getUnreadCount(req, res) {
  try {
    const { roll_no } = req.student;
    const count = await prisma.notification.count({ where: { roll_no, is_read: false } });
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

module.exports = { getNotifications, markAsRead, getUnreadCount };
