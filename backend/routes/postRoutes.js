const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  sharePost,
  deletePost,
  searchPosts,
  updatePost
} = require('../controllers/postController');

router.route('/')
  .post(protect, upload.array('media', 10), createPost) // Allow up to 10 media files
  .get(protect, getFeedPosts);

router.get('/search', protect, searchPosts);
router.get('/user/:userId', protect, getUserPosts);

router.route('/:postId')
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:postId/like', protect, toggleLike);
router.post('/:postId/comment', protect, addComment);
router.post('/:postId/share', protect, sharePost);

module.exports = router;