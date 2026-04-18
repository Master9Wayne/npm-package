const { prisma } = require('../config/db.config');

// Get friends with packages arriving today
async function getFriendsPackagesToday(req, res) {
  try {
    const { roll_no, hostel_id } = req.student;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get accepted friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: roll_no, status: 'ACCEPTED' },
          { receiver_id: roll_no, status: 'ACCEPTED' }
        ]
      }
    });

    const friendRollNos = friendships.map(f =>
      f.requester_id === roll_no ? f.receiver_id : f.requester_id
    );

    // Get their packages arriving today
    const packagesWithFriends = await prisma.package.findMany({
      where: {
        roll_no: { in: friendRollNos },
        arrival_datetime: { gte: todayStart, lte: todayEnd }
      },
      include: {
        student: { select: { name: true, roll_no: true, room_no: true } },
        platform: { select: { name: true } }
      }
    });

    res.json({ friendsPackages: packagesWithFriends });
  } catch (err) {
    console.error('Community error:', err);
    res.status(500).json({ error: 'Failed to fetch community data' });
  }
}

// Toggle opt-in for community notifications
async function toggleCommunityOptIn(req, res) {
  try {
    const { roll_no } = req.student;
    const { opt_in } = req.body;

    // Find or create group membership for student's hostel
    const student = await prisma.student.findUnique({
      where: { roll_no },
      select: { hostel_id: true }
    });

    if (!student?.hostel_id) return res.status(400).json({ error: 'No hostel assigned' });

    let group = await prisma.communityGroup.findFirst({
      where: { hostel_id: student.hostel_id }
    });

    if (!group) {
      group = await prisma.communityGroup.create({
        data: { name: 'Hostel Community', hostel_id: student.hostel_id }
      });
    }

    await prisma.groupMember.upsert({
      where: { group_id_roll_no: { group_id: group.group_id, roll_no } },
      create: { group_id: group.group_id, roll_no, opt_in_community: opt_in },
      update: { opt_in_community: opt_in }
    });

    res.json({ message: `Community notifications ${opt_in ? 'enabled' : 'disabled'}` });
  } catch (err) {
    console.error('Toggle opt-in error:', err);
    res.status(500).json({ error: 'Failed to update preference' });
  }
}

module.exports = { getFriendsPackagesToday, toggleCommunityOptIn };
