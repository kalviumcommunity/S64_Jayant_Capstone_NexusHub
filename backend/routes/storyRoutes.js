const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectMiddleware');
const upload = require('../middleware/uploadMiddleware');
const storyController = require('../controllers/storyController');

// Create story (media upload)
router.post('/', protect, upload.array('media', 5), storyController.createStory);
// Get all active stories
router.get('/', protect, storyController.getActiveStories);
// Get single story
router.get('/:id', protect, storyController.getStoryById);
// Like/unlike story
router.post('/:id/like', protect, storyController.likeStory);
// Comment on story
router.post('/:id/comment', protect, storyController.commentOnStory);
// Mark as viewed
router.post('/:id/view', protect, storyController.viewStory);
// Get viewers/likes (owner only)
router.get('/:id/viewers', protect, storyController.getStoryViewers);
// Delete story (owner only)
router.delete('/:id', protect, storyController.deleteStory);

module.exports = router; 