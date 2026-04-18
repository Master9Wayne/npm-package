const cron = require('node-cron');
const { prisma } = require('../config/db.config');
const { createNotification } = require('./notification.utils');

async function checkDeadlineWarnings() {
  try {
    const now = new Date();

    // Find packages where we are at 80% of the deadline window
    const packages = await prisma.package.findMany({
      where: { status: 'PENDING' },
      include: { student: { select: { roll_no: true, name: true } } }
    });

    for (const pkg of packages) {
      const totalWindow = pkg.pickup_deadline.getTime() - pkg.arrival_datetime.getTime();
      const elapsed = now.getTime() - pkg.arrival_datetime.getTime();
      const pct = elapsed / totalWindow;

      const hoursLeft = (pkg.pickup_deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      // At 80% mark, send deadline warning (within a 1-hour window to avoid duplicate triggers)
      if (pct >= 0.80 && pct < 0.83) {
        const existingWarning = await prisma.notification.findFirst({
          where: { roll_no: pkg.roll_no, package_id: pkg.package_id, type: 'DEADLINE_WARNING' }
        });

        if (!existingWarning) {
          await createNotification({
            roll_no: pkg.roll_no,
            package_id: pkg.package_id,
            type: 'DEADLINE_WARNING',
            message: `Reminder: Package ${pkg.package_id} must be collected within ${Math.ceil(hoursLeft)} hours or it will be returned to sender.`
          });
        }
      }

      // At 100% (overdue), mark as OVERDUE then RETURNING
      if (now > pkg.pickup_deadline) {
        if (pkg.status === 'PENDING') {
          await prisma.package.update({
            where: { package_id: pkg.package_id },
            data: { status: 'OVERDUE' }
          });
        } else if (pkg.status === 'OVERDUE') {
          // Give 1 more day before RETURNING
          const overdueBy = now.getTime() - pkg.pickup_deadline.getTime();
          if (overdueBy > 24 * 60 * 60 * 1000) {
            await prisma.package.update({
              where: { package_id: pkg.package_id },
              data: { status: 'RETURNING' }
            });

            await createNotification({
              roll_no: pkg.roll_no,
              package_id: pkg.package_id,
              type: 'RETURNING',
              message: `Package ${pkg.package_id} has not been collected and is being returned to sender.`
            });

            // Expire any pending pickup auths
            await prisma.pickupAuth.updateMany({
              where: { package_id: pkg.package_id, status: { in: ['PENDING', 'ACCEPTED'] } },
              data: { status: 'EXPIRED' }
            });
          }
        }
      }
    }

    console.log(`[CRON] Deadline check complete — checked ${packages.length} packages`);
  } catch (err) {
    console.error('[CRON] Deadline check error:', err);
  }
}

async function expirePickupAuths() {
  try {
    const result = await prisma.pickupAuth.updateMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        expires_at: { lt: new Date() }
      },
      data: { status: 'EXPIRED' }
    });
    if (result.count > 0) {
      console.log(`[CRON] Expired ${result.count} pickup authorizations`);
    }
  } catch (err) {
    console.error('[CRON] Expire auths error:', err);
  }
}

function startCronJobs() {
  // Run every hour
  cron.schedule('0 * * * *', checkDeadlineWarnings);
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', expirePickupAuths);
  console.log('[CRON] Jobs started');
}

module.exports = { startCronJobs };
