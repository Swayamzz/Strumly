const prisma = require('../utils/prismaClient');

// Toggle save/unsave a post
const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
      return res.json({ success: true, saved: false, message: 'Post removed from saved' });
    }

    await prisma.savedPost.create({ data: { userId, postId } });
    res.json({ success: true, saved: true, message: 'Post saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all saved posts for the logged-in user
const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const saved = await prisma.savedPost.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true, username: true, firstName: true,
                lastName: true, profilePicture: true,
              },
            },
            media: true,
            _count: { select: { comments: true, likes: true } },
            likes: { where: { userId }, select: { userId: true } },
          },
        },
      },
    });

    const data = saved.map(s => ({
      ...s.post,
      isLiked: s.post.likes.length > 0,
      likes: undefined,
      savedAt: s.savedAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { toggleBookmark, getSavedPosts };
