const prisma = require('../utils/prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get User Posts ───────────────────────────────────────────────────────────
const getUserPosts = async (req, res) => {
  try {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: posts });
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

    res.status(201).json({ success: true, data: comment });
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

    res.json({ success: true, data: comments });
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

module.exports = { upload, createPost, getFeed, getUserPosts, likePost, addComment, getComments, deletePost };