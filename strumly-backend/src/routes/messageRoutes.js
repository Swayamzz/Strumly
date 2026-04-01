const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount } = require('../controllers/messageController');

router.get('/conversations',        protect, getConversations);
router.get('/unread-count',         protect, getUnreadCount);
router.get('/:conversationId',      protect, getMessages);
router.post('/send',                protect, sendMessage);
router.delete('/:messageId',        protect, deleteMessage);

module.exports = router;
