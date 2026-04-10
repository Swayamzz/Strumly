const prisma = require('../utils/prismaClient');

const actorSelect = {
  id: true, username: true, firstName: true, lastName: true, profilePicture: true
};

// GET /api/notifications — get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      include: { actor: { select: actorSelect } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { recipientId: req.user.id, read: false }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, recipientId: req.user.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/read-all — mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, recipientId: req.user.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper — called internally from other controllers to create notifications
const createNotification = async ({ recipientId, actorId, type, message, postId, bandId }) => {
  if (recipientId === actorId) return; // don't notify yourself
  try {
    await prisma.notification.create({
      data: { recipientId, actorId, type, message, postId: postId || null, bandId: bandId || null }
    });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification };
