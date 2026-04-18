const { prisma } = require('../config/db.config');
const { createNotification } = require('../utils/notification.utils');

// Authorize a friend to pick up a package
async function authorizePickup(req, res) {
  try {
    const { roll_no } = req.student;
    const { package_id, friend_roll_no, expires_hours = 48 } = req.body;

    // Verify package belongs to student
    const pkg = await prisma.package.findUnique({ where: { package_id } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    if (pkg.roll_no !== roll_no) return res.status(403).json({ error: 'Not your package' });
    if (pkg.status !== 'PENDING') return res.status(400).json({ error: 'Package is not pending' });

    // Verify they are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requester_id: roll_no, receiver_id: friend_roll_no },
          { requester_id: friend_roll_no, receiver_id: roll_no }
        ],
        status: 'ACCEPTED'
      }
    });

    if (!friendship) return res.status(400).json({ error: 'You can only authorize friends' });

    // Check for existing active auth
    const existing = await prisma.pickupAuth.findFirst({
      where: { package_id, authorized_by: roll_no, status: { in: ['PENDING', 'ACCEPTED'] } }
    });
    if (existing) return res.status(409).json({ error: 'Active authorization already exists for this package' });

    const expires_at = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

    const auth = await prisma.pickupAuth.create({
      data: {
        package_id,
        authorized_by: roll_no,
        authorized_to: friend_roll_no,
        status: 'PENDING',
        expires_at
      },
      include: { friend: { select: { name: true } } }
    });

    const owner = await prisma.student.findUnique({ where: { roll_no }, select: { name: true } });

    await createNotification({
      roll_no: friend_roll_no,
      package_id,
      type: 'PICKUP_AUTHORIZED',
      message: `${owner.name} has authorized you to pick up package ${package_id}. Authorization expires in ${expires_hours} hours.`
    });

    res.status(201).json({ message: 'Pickup authorized', auth });
  } catch (err) {
    console.error('Authorize pickup error:', err);
    res.status(500).json({ error: 'Failed to authorize pickup' });
  }
}

// Friend accepts or declines pickup authorization
async function respondPickupAuth(req, res) {
  try {
    const { roll_no } = req.student;
    const { auth_id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    const auth = await prisma.pickupAuth.findUnique({
      where: { auth_id: parseInt(auth_id) },
      include: { package: true, owner: { select: { name: true } } }
    });

    if (!auth) return res.status(404).json({ error: 'Authorization not found' });
    if (auth.authorized_to !== roll_no) return res.status(403).json({ error: 'Not authorized' });
    if (auth.status !== 'PENDING') return res.status(400).json({ error: 'Authorization already handled' });
    if (auth.expires_at < new Date()) return res.status(400).json({ error: 'Authorization expired' });

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.pickupAuth.update({
      where: { auth_id: parseInt(auth_id) },
      data: { status }
    });

    const friend = await prisma.student.findUnique({ where: { roll_no }, select: { name: true } });

    await createNotification({
      roll_no: auth.authorized_by,
      package_id: auth.package_id,
      type: 'PICKUP_AUTHORIZED',
      message: `${friend.name} has ${status.toLowerCase()} the pickup authorization for package ${auth.package_id}.`
    });

    res.json({ message: `Authorization ${status.toLowerCase()}`, auth: updated });
  } catch (err) {
    console.error('Respond pickup auth error:', err);
    res.status(500).json({ error: 'Failed to respond to authorization' });
  }
}

// Get pickup auths for a student (authorizations they gave or received)
async function getPickupAuths(req, res) {
  try {
    const { roll_no } = req.student;
    const { type = 'given' } = req.query; // 'given' or 'received'

    const where = type === 'given'
      ? { authorized_by: roll_no }
      : { authorized_to: roll_no };

    const auths = await prisma.pickupAuth.findMany({
      where,
      include: {
        package: { include: { platform: true } },
        owner: { select: { name: true, roll_no: true } },
        friend: { select: { name: true, roll_no: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ auths });
  } catch (err) {
    console.error('Get pickup auths error:', err);
    res.status(500).json({ error: 'Failed to fetch authorizations' });
  }
}

// Revoke a pickup authorization
async function revokePickupAuth(req, res) {
  try {
    const { roll_no } = req.student;
    const { auth_id } = req.params;

    const auth = await prisma.pickupAuth.findUnique({ where: { auth_id: parseInt(auth_id) } });
    if (!auth) return res.status(404).json({ error: 'Authorization not found' });
    if (auth.authorized_by !== roll_no) return res.status(403).json({ error: 'Not your authorization' });
    if (!['PENDING', 'ACCEPTED'].includes(auth.status)) {
      return res.status(400).json({ error: 'Cannot revoke this authorization' });
    }

    await prisma.pickupAuth.update({
      where: { auth_id: parseInt(auth_id) },
      data: { status: 'DECLINED' }
    });

    res.json({ message: 'Authorization revoked' });
  } catch (err) {
    console.error('Revoke auth error:', err);
    res.status(500).json({ error: 'Failed to revoke authorization' });
  }
}

module.exports = { authorizePickup, respondPickupAuth, getPickupAuths, revokePickupAuth };
