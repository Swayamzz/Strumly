const prisma = require('../utils/prismaClient');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalPosts, totalBands, totalMessages, totalConversations, newUsersThisWeek, pendingFollowRequests] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.band.count(),
      prisma.message.count(),
      prisma.conversation.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.follow.count({ where: { status: 'PENDING' } }),
    ]);

    // Registration growth — last 7 days
    const registrations = await prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    const growthMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      growthMap[key] = 0;
    }
    registrations.forEach(r => {
      const key = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (growthMap[key] !== undefined) growthMap[key]++;
    });

    res.json({
      success: true,
      data: {
        totalUsers, totalPosts, totalBands, totalMessages, totalConversations,
        newUsersThisWeek, pendingFollowRequests,
        registrationGrowth: Object.entries(growthMap).map(([date, count]) => ({ date, count })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        role: true, skillLevel: true, instruments: true, location: true, createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['MUSICIAN', 'BAND_LEADER', 'ADMIN'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/posts
const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true } },
        media: { select: { url: true, type: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/posts/:id
const deletePost = async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/bands
const getBands = async (req, res) => {
  try {
    const bands = await prisma.band.findMany({
      include: {
        _count: { select: { members: true } },
        members: {
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: bands.length, data: bands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/bands/:id
const deleteBand = async (req, res) => {
  try {
    await prisma.band.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Band deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/follow-requests
const getPendingFollows = async (req, res) => {
  try {
    const requests = await prisma.follow.findMany({
      where: { status: 'PENDING' },
      include: {
        follower: { select: { id: true, username: true, firstName: true, lastName: true } },
        following: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    // Top posters
    const topPosters = await prisma.user.findMany({
      select: {
        id: true, username: true, firstName: true, lastName: true,
        _count: { select: { posts: true, followers: true } },
      },
      orderBy: { posts: { _count: 'desc' } },
      take: 5,
    });

    // Instruments & genres frequency
    const allUsers = await prisma.user.findMany({ select: { instruments: true, genres: true } });
    const instrumentMap = {};
    const genreMap = {};
    allUsers.forEach(u => {
      u.instruments.forEach(i => { instrumentMap[i] = (instrumentMap[i] || 0) + 1; });
      u.genres.forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1; });
    });
    const topInstruments = Object.entries(instrumentMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
    const topGenres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

    // Registration growth — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });
    const growthMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      growthMap[key] = 0;
    }
    recentUsers.forEach(u => {
      const key = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (growthMap[key] !== undefined) growthMap[key]++;
    });

    res.json({
      success: true,
      data: {
        topPosters,
        topInstruments,
        topGenres,
        registrationGrowth: Object.entries(growthMap).map(([date, count]) => ({ date, count })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/users/:id/ban — ban or unban a user
const toggleBanUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(400).json({ success: false, message: 'Cannot ban an admin' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: !user.isBanned },
      select: { id: true, username: true, isBanned: true }
    });
    res.json({ success: true, data: updated, message: updated.isBanned ? 'User banned' : 'User unbanned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getUsers, updateUserRole, deleteUser, getPosts, deletePost, getBands, deleteBand, getPendingFollows, getAnalytics, toggleBanUser };
