const prisma = require('../utils/prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `media-${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp3|mp4|wav|ogg|mov|avi|webm/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only audio, video and image files allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// POST /api/media — upload a media file
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { description } = req.body;

    const ext = path.extname(req.file.originalname).toLowerCase();
    const isAudio = /mp3|wav|ogg/.test(ext);
    const isVideo = /mp4|mov|avi|webm/.test(ext);
    const fileType = isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : 'IMAGE';

    const media = await prisma.mediaFile.create({
      data: {
        userId: req.user.id,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType,
        fileSize: req.file.size,
        description: description || null,
      },
    });
    res.status(201).json({ success: true, data: media });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/media/my — current user's media files
const getMyMedia = async (req, res) => {
  try {
    const files = await prisma.mediaFile.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/media/user/:userId — another user's public media
const getUserMedia = async (req, res) => {
  try {
    const files = await prisma.mediaFile.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/media/:id — delete own media file
const deleteMedia = async (req, res) => {
  try {
    const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    if (file.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const fullPath = path.join(process.cwd(), file.fileUrl);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await prisma.mediaFile.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { mediaUpload, uploadMedia, getMyMedia, getUserMedia, deleteMedia };
