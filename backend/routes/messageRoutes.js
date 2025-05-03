const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectMiddleware');
const {
  sendMessage,
  allMessages,
  markAsRead
} = require('../controllers/messageController');

router.route('/').post(protect, sendMessage);
router.route('/:chatId')
  .get(protect, allMessages);
router.put('/:chatId/read', protect, markAsRead);

module.exports = router; 