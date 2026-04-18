const { prisma } = require('../config/db.config');
const { createNotification } = require('../utils/notification.utils');

// Search students by name (same hostel)
async function searchStudents(req, res) {
  try {
    const { name } = req.query;
    const { roll_no, hostel_id } = req.student;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const students = await prisma.student.findMany({
      where: {
        hostel_id,
        name: { contains: name },
        roll_no: { not: roll_no }
      },
      select: { roll_no: true, name: true, room_no: true },
      take: 10
    });

    // Add friendship status
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: roll_no, receiver_id: { in: students.map(s => s.roll_no) } },
          { receiver_id: roll_no, requester_id: { in: students.map(s => s.roll_no) } }
        ]
      }
    });

    const result = students.map(s => {
      const friendship = friendships.find(
        f => f.requester_id === s.roll_no || f.receiver_id === s.roll_no
      );
      return { ...s, friendshipStatus: friendship?.status || null, friendshipId: friendship?.friendship_id || null };
    });

    res.json({ students: result });
  } catch (err) {
    console.error('Search students error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
}

// Send friend request
async function sendFriendRequest(req, res) {
  try {
    const { roll_no } = req.student;
    const { receiver_roll_no } = req.body;

    if (roll_no === receiver_roll_no) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requester_id: roll_no, receiver_id: receiver_roll_no },
          { requester_id: receiver_roll_no, receiver_id: roll_no }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Friendship already exists or pending' });
    }

    const friendship = await prisma.friendship.create({
      data: { requester_id: roll_no, receiver_id: receiver_roll_no, status: 'PENDING' }
    });

    const requester = await prisma.student.findUnique({
      where: { roll_no },
      select: { name: true }
    });

    await createNotification({
      roll_no: receiver_roll_no,
      type: 'FRIEND_REQUEST',
      message: `${requester.name} sent you a friend request.`
    });

    res.status(201).json({ message: 'Friend request sent', friendship });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Failed to send request' });
  }
}

// Respond to friend request
async function respondFriendRequest(req, res) {
  try {
    const { roll_no } = req.student;
    const { friendship_id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    const friendship = await prisma.friendship.findUnique({
      where: { friendship_id: parseInt(friendship_id) }
    });

    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.receiver_id !== roll_no) return res.status(403).json({ error: 'Not authorized' });
    if (friendship.status !== 'PENDING') return res.status(400).json({ error: 'Request already handled' });

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.friendship.update({
      where: { friendship_id: parseInt(friendship_id) },
      data: { status }
    });

    res.json({ message: `Friend request ${status.toLowerCase()}`, friendship: updated });
  } catch (err) {
    console.error('Respond friend request error:', err);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
}

// Get friends list
async function getFriends(req, res) {
  try {
    const { roll_no } = req.student;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: roll_no, status: 'ACCEPTED' },
          { receiver_id: roll_no, status: 'ACCEPTED' }
        ]
      },
      include: {
        requester: { select: { roll_no: true, name: true, room_no: true, hostel: true } },
        receiver: { select: { roll_no: true, name: true, room_no: true, hostel: true } }
      }
    });

    const friends = friendships.map(f => {
      const friend = f.requester_id === roll_no ? f.receiver : f.requester;
      return { ...friend, friendship_id: f.friendship_id };
    });

    res.json({ friends });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
}

// Get pending requests
async function getPendingRequests(req, res) {
  try {
    const { roll_no } = req.student;

    const requests = await prisma.friendship.findMany({
      where: { receiver_id: roll_no, status: 'PENDING' },
      include: {
        requester: { select: { roll_no: true, name: true, room_no: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ requests });
  } catch (err) {
    console.error('Get pending requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

// Remove friend
async function removeFriend(req, res) {
  try {
    const { roll_no } = req.student;
    const { friendship_id } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { friendship_id: parseInt(friendship_id) }
    });

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

    if (friendship.requester_id !== roll_no && friendship.receiver_id !== roll_no) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.friendship.delete({ where: { friendship_id: parseInt(friendship_id) } });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
}

module.exports = {
  searchStudents,
  sendFriendRequest,
  respondFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend
};
