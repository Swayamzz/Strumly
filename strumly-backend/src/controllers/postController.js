const prisma = require('../utils/prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('./notificationController');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only images and videos allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ─── Create Post ─────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const authorId = req.user.id;

    if (!content && !req.file)
      return res.status(400).json({ success: false, message: 'Post needs content or media' });

    let mediaType = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      mediaType = ['.mp4', '.mov', '.avi', '.webm'].includes(ext) ? 'VIDEO' : 'IMAGE';
    }

    const post = await prisma.post.create({
      data: {
        content: content || '',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        authorId,
        ...(req.file && {
          media: {
            create: {
              url: `/uploads/${req.file.filename}`,
              type: mediaType,
              filename: req.file.originalname,
              size: req.file.size,
            },
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true, username: true, firstName: true, lastName: true,
            instruments: true, genres: true, skillLevel: true, profilePicture: true,
          },
        },
        media: true,
        _count: { select: { comments: true, likes: true } },
      },
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Feed ────────────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true, username: true, firstName: true, lastName: true,
            instruments: true, genres: true, skillLevel: true, profilePicture: true,
          },
        },
        media: true,
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const data = posts.map(p => ({ ...p, isLiked: p.likes.length > 0, likes: undefined }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get User Posts ───────────────────────────────────────────────────────────
const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await prisma.post.findMany({
      where: { authorId: req.params.userId },
      include: {
        author: {
          select: {
            id: true, username: true, firstName: true, lastName: true,
            instruments: true, skillLevel: true, profilePicture: true,
          },
        },
        media: true,
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = posts.map(p => ({ ...p, isLiked: p.likes.length > 0, likes: undefined }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Like / Unlike Post ───────────────────────────────────────────────────────
const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
      const count = await prisma.postLike.count({ where: { postId } });
      return res.json({ success: true, liked: false, likes: count });
    }

    await prisma.postLike.create({ data: { userId, postId } });
    const count = await prisma.postLike.count({ where: { postId } });
    res.json({ success: true, liked: true, likes: count });
    try {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
      if (post) await createNotification({ recipientId: post.authorId, actorId: userId, type: 'POST_LIKE', message: `${req.user.firstName || req.user.username} liked your post`, postId });
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Add Comment ──────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });

    const comment = await prisma.postComment.create({
      data: {
        content,
        postId: req.params.postId,
        userId: req.user.id,
      },
    });

    // Attach the author info manually (no relation in schema yet)
    const commentWithUser = {
      ...comment,
      user: {
        id: req.user.id,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture || null,
      },
    };

    res.status(201).json({ success: true, data: commentWithUser });
    // Fire notification after response — don't let it block or break the comment
    try {
      const post = await prisma.post.findUnique({ where: { id: req.params.postId }, select: { authorId: true } });
      if (post) await createNotification({ recipientId: post.authorId, actorId: req.user.id, type: 'POST_COMMENT', message: `${req.user.firstName || req.user.username} commented on your post`, postId: req.params.postId });
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Comments ─────────────────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const comments = await prisma.postComment.findMany({
      where: { postId: req.params.postId },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich with user data via separate query
    const userIds = [...new Set(comments.map(c => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const enriched = comments.map(c => ({ ...c, user: userMap[c.userId] || null }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Delete Post ──────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.postId },
      include: { media: true },
    });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    // Delete associated media files from disk
    for (const m of post.media) {
      const fp = path.join(__dirname, '../..', m.url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await prisma.post.delete({ where: { id: req.params.postId } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Delete Comment ───────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await prisma.postComment.findUnique({ where: { id: req.params.commentId } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.userId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });

    await prisma.postComment.delete({ where: { id: req.params.commentId } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Trending Posts ───────────────────────────────────────────────────────────
const getTrendingPosts = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
    const posts = await prisma.post.findMany({
      where: { createdAt: { gte: since } },
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true, instruments: true, skillLevel: true } },
        media: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: 'desc' } },
      take: 20,
    });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, createPost, getFeed, getUserPosts, likePost, addComment, getComments, deletePost, deleteComment, getTrendingPosts };