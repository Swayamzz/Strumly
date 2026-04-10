
const prisma = require('../utils/prismaClient');
const { createNotification } = require('./notificationController');
// POST /api/follow/:userId/follow
const sendFollowRequest = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    // Check target user exists
    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if already following or request pending
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') return res.status(400).json({ success: false, message: 'Already following' });
      if (existing.status === 'PENDING')  return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    const follow = await prisma.follow.create({
      data: { followerId, followingId, status: 'PENDING' },
      include: { follower: { select: { id:true, username:true, firstName:true, lastName:true } } }
    });

    await createNotification({ recipientId: followingId, actorId: followerId, type: 'FOLLOW', message: `${follow.follower.firstName || follow.follower.username} sent you a follow request` });
    res.json({ success: true, message: 'Follow request sent', data: follow });
  } catch (err) {
    console.error('sendFollowRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/follow/:userId/unfollow
const unfollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    await prisma.follow.deleteMany({ where: { followerId, followingId } });

    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/follow/:requestId/accept
const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const follow = await prisma.follow.findUnique({ where: { id: requestId } });
    if (!follow) return res.status(404).json({ success: false, message: 'Request not found' });
    if (follow.followingId !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (follow.status === 'ACCEPTED') return res.status(400).json({ success: false, message: 'Already accepted' });

    const updated = await prisma.follow.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: { follower: { select: { id:true, username:true, firstName:true, lastName:true } } }
    });

    await createNotification({ recipientId: follow.followerId, actorId: userId, type: 'FOLLOW_ACCEPTED', message: `${req.user.firstName || req.user.username} accepted your follow request` });
    res.json({ success: true, message: 'Follow request accepted', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/follow/:requestId/decline
const declineRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const follow = await prisma.follow.findUnique({ where: { id: requestId } });
    if (!follow) return res.status(404).json({ success: false, message: 'Request not found' });
    if (follow.followingId !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.follow.delete({ where: { id: requestId } });

    res.json({ success: true, message: 'Follow request declined' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/follow/requests/pending  — requests YOU received
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.follow.findMany({
      where: { followingId: userId, status: 'PENDING' },
      include: {
        follower: {
          select: {
            id:true, username:true, firstName:true, lastName:true,
            instruments:true, genres:true, skillLevel:true, location:true, profilePicture:true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/follow/:userId/followers
const getFollowers = async (req, res) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: req.params.userId, status: 'ACCEPTED' },
      include: {
        follower: {
          select: { id:true, username:true, firstName:true, lastName:true, instruments:true, skillLevel:true, profilePicture:true }
        }
      }
    });
    res.json({ success: true, data: follows.map(f => f.follower), count: follows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/follow/:userId/following
const getFollowing = async (req, res) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.params.userId, status: 'ACCEPTED' },
      include: {
        following: {
          select: { id:true, username:true, firstName:true, lastName:true, instruments:true, skillLevel:true, profilePicture:true }
        }
      }
    });
    res.json({ success: true, data: follows.map(f => f.following), count: follows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/follow/:userId/status  — what is MY relationship to this user?
const getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    // Also get counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId, status: 'ACCEPTED' } }),
      prisma.follow.count({ where: { followerId: followingId, status: 'ACCEPTED' } }),
    ]);

    res.json({
      success: true,
      data: {
        status: follow?.status || 'NONE',   // NONE | PENDING | ACCEPTED
        followId: follow?.id || null,
        followerCount,
        followingCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendFollowRequest, unfollow, acceptRequest, declineRequest, getPendingRequests, getFollowers, getFollowing, getFollowStatus };
