const { prisma } = require('../config/db.config');

async function createNotification({ roll_no, package_id = null, type, message }) {
  try {
    return await prisma.notification.create({
      data: { roll_no, package_id, type, message }
    });
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

module.exports = { createNotification };
