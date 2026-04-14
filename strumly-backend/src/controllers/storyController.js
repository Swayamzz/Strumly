const prisma = require('../utils/prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `story-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov/;
  allowed.test(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Only images and videos allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 30 * 1024 * 1024 } });

// Create a story (expires in 24 hours)
const createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Media file is required for a story' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const mediaType = ['.mp4', '.mov'].includes(ext) ? 'VIDEO' : 'IMAGE';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const story = await prisma.story.create({
      data: {
        authorId: req.user.id,
        mediaUrl: `/uploads/${req.file.filename}`,
        mediaType,
        expiresAt,
      },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
    });

    res.status(201).json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get active stories from followed users
const getStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get IDs of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId, status: 'ACCEPTED' },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // include own stories

    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        expiresAt: { gt: now },
      },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete own story
const deleteStory = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const fp = path.join(process.cwd(), story.mediaUrl);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);

    await prisma.story.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Clean up expired stories (called periodically)
const cleanExpiredStories = async (req, res) => {
  try {
    const expired = await prisma.story.findMany({ where: { expiresAt: { lt: new Date() } } });
    for (const s of expired) {
      const fp = path.join(process.cwd(), s.mediaUrl);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await prisma.story.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    res.json({ success: true, message: `Cleaned ${expired.length} expired stories` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, createStory, getStories, deleteStory, cleanExpiredStories };
