const prisma = require('../utils/prismaClient');

// Report a user
const reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { reportedId } = req.params;
    const { reason, description } = req.body;

    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });
    if (reporterId === reportedId) return res.status(400).json({ success: false, message: 'You cannot report yourself' });

    const reported = await prisma.user.findUnique({ where: { id: reportedId } });
    if (!reported) return res.status(404).json({ success: false, message: 'User not found' });

    // Log report as a notification to admins (simple approach without extra model)
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map(admin =>
      prisma.notification.create({
        data: {
          type: 'FOLLOW', // reusing type as a generic alert
          message: `User @${req.user.username} reported @${reported.username}: ${reason}${description ? ' – ' + description : ''}`,
          recipientId: admin.id,
          actorId: reporterId,
        },
      })
    ));

    res.json({ success: true, message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Report a post
const reportPost = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { postId } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

    const post = await prisma.post.findUnique({ where: { id: postId }, include: { author: { select: { username: true } } } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map(admin =>
      prisma.notification.create({
        data: {
          type: 'FOLLOW',
          message: `User @${req.user.username} reported a post by @${post.author.username}: ${reason}`,
          recipientId: admin.id,
          actorId: reporterId,
          postId,
        },
      })
    ));

    res.json({ success: true, message: 'Post reported. Our team will review it.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { reportUser, reportPost };
