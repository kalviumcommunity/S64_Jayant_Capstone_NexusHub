const express = require('express');
const router = express.Router();
const protect  = require('../middleware/protectMiddleware');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroupChat,
  addToGroup,
  removeFromGroup,
  createTeamChat,
  createProjectChat
} = require('../controllers/chatController');

// Access chat or create new one (1-on-1)
router.route('/').post(protect, accessChat).get(protect, fetchChats);

// Group chat routes
router.post('/group', protect, createGroupChat);
router.post('/team/:teamId', protect, createTeamChat);
router.post('/project/:projectId', protect, createProjectChat);
router.put('/group/:chatId', protect, updateGroupChat);
router.put('/group/add', protect, addToGroup);
router.put('/group/remove', protect, removeFromGroup);

module.exports = router;
