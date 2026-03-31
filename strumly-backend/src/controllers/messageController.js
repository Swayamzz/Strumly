const prisma = require('../utils/prismaClient');

// Check if two users can message each other (must follow each other)
const canMessage = async (userId1, userId2) => {
  const [follows1, follows2] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId1, followingId: userId2 } } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId2, followingId: userId1 } } }),
  ]);
  return (follows1?.status === 'ACCEPTED') || (follows2?.status === 'ACCEPTED');
};

// GET /api/messages/conversations — list all conversations for current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: { select: { id:true, username:true, firstName:true, lastName:true, skillLevel:true, instruments:true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format: attach the "other" user and unread count
    const formatted = await Promise.all(conversations.map(async (conv) => {
      const other = conv.participants.find(p => p.userId !== userId)?.user;
      const unread = await prisma.message.count({
        where: { conversationId: conv.id, senderId: { not: userId }, read: false }
      });
      return {
        id: conv.id,
        other,
        lastMessage: conv.messages[0] || null,
        unreadCount: unread,
        updatedAt: conv.updatedAt,
      };
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages/:conversationId — get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });
    if (!participant) return res.status(403).json({ success: false, message: 'Not authorized' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id:true, username:true, firstName:true, lastName:true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark all as read
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, read: false },
      data: { read: true }
    });

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/messages/send — send a message (creates conversation if needed)
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, conversationId } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    let convId = conversationId;

    if (!convId) {
      // Check if they can message each other
      const allowed = await canMessage(senderId, receiverId);
      if (!allowed) return res.status(403).json({ success: false, message: 'You can only message people you follow or who follow you' });

      // Check if conversation already exists between these two users
      const existing = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: receiverId } } },
          ]
        }
      });

      if (existing) {
        convId = existing.id;
      } else {
        // Create new conversation
        const conv = await prisma.conversation.create({
          data: {
            participants: {
              create: [{ userId: senderId }, { userId: receiverId }]
            }
          }
        });
        convId = conv.id;
      }
    }

    const message = await prisma.message.create({
      data: { content: content.trim(), senderId, conversationId: convId },
      include: {
        sender: { select: { id:true, username:true, firstName:true, lastName:true } }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

    res.status(201).json({ success: true, data: { message, conversationId: convId } });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/messages/:messageId — delete own message
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const msg = await prisma.message.findUnique({ where: { id: req.params.messageId } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });
    await prisma.message.delete({ where: { id: req.params.messageId } });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: { conversation: { participants: { some: { userId: req.user.id } } }, senderId: { not: req.user.id }, read: false }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount };
