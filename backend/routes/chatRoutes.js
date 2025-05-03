const express = require('express');
const router = express.Router();
const protect  = require('../middleware/protectMiddleware');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroupChat,
  addToGroup,
  removeFromGroup
} = require('../controllers/chatController');

// Access chat or create new one (1-on-1)
router.route('/').post(protect, accessChat).get(protect, fetchChats);

// Group chat routes
router.post('/group', protect, createGroupChat);
router.put('/group/:chatId', protect, updateGroupChat);
router.put('/group/add', protect, addToGroup);
router.put('/group/remove', protect, removeFromGroup);

module.exports = router;
