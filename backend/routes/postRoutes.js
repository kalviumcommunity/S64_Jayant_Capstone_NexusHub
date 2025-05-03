const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectMiddleware');
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  sharePost,
  deletePost,
  searchPosts
} = require('../controllers/postController');

router.route('/')
  .post(protect, createPost)
  .get(protect, getFeedPosts);

router.get('/search', protect, searchPosts);
router.get('/user/:userId', protect, getUserPosts);

router.route('/:postId')
  .delete(protect, deletePost);

router.post('/:postId/like', protect, toggleLike);
router.post('/:postId/comment', protect, addComment);
router.post('/:postId/share', protect, sharePost);

module.exports = router; 