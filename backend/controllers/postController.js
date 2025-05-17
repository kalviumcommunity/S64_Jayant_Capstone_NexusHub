const Post = require('../models/postModel');
const User = require('../models/userModel');
const { getIO } = require('../socket');

// Create post
exports.createPost = async (req, res) => {
  try {
    const { content, tags, visibility, project, location } = req.body;
    
    // Process uploaded files
    const mediaFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Determine file type
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        
        // Create media object
        mediaFiles.push({
          type: fileType,
          url: `/uploads/${file.filename}`,
          name: file.originalname,
          size: file.size
        });
      }
    }

    // Parse tags if they come as a string
    let parsedTags = tags || [];
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        // If not valid JSON, split by comma
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      media: mediaFiles,
      tags: parsedTags,
      visibility: visibility || 'public',
      project: project || null,
      location: location || null
    });

    await post.populate('author', 'name email profilePicture');
    if (project) {
      await post.populate('project', 'title');
    }

    // Emit new post to followers
    getIO().emit('new_post', post);

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// Get feed posts
exports.getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    // Since the user model doesn't have a connections field, we'll just show public posts
    // and posts by the current user
    const query = {
      $or: [
        { visibility: 'public' },
        { author: req.user._id }
      ]
    };

    // Add tag filter if provided
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
      .populate('author', 'name email profilePicture')
      .populate('project', 'title')
      .populate('comments.user', 'name email profilePicture')
      .populate('likes.user', 'name email profilePicture');

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const query = { author: userId };
    if (userId !== req.user._id.toString()) {
      query.visibility = { $ne: 'private' };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
      .populate('author', 'name email profilePicture')
      .populate('project', 'title')
      .populate('comments.user', 'name email profilePicture')
      .populate('likes.user', 'name email profilePicture');

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts',
      error: error.message
    });
  }
};

// Like/Unlike post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push({ user: req.user._id });
    }

    await post.save();
    await post.populate('likes.user', 'name email profilePicture');

    // Emit like update
    getIO().emit('post_like_update', {
      postId: post._id,
      likes: post.likes
    });

    res.json({
      success: true,
      likes: post.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.comments.push({
      user: req.user._id,
      content
    });

    await post.save();
    await post.populate('comments.user', 'name email profilePicture');

    // Emit new comment
    getIO().emit('new_comment', {
      postId: post._id,
      comments: post.comments
    });

    res.json({
      success: true,
      comments: post.comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Share post
exports.sharePost = async (req, res) => {
  try {
    const { content } = req.body;
    console.log('Sharing post with content:', content);
    const originalPost = await Post.findById(req.params.postId)
      .populate('author', 'name email profilePicture');

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create new post as share
    const sharedPost = await Post.create({
      author: req.user._id,
      content: content || '',
      sharedPost: originalPost._id,
      visibility: originalPost.visibility
    });

    // Add share to original post
    originalPost.shares.push({
      user: req.user._id
    });
    await originalPost.save();

    await sharedPost.populate('author', 'name email profilePicture');
    await sharedPost.populate({
      path: 'sharedPost',
      populate: {
        path: 'author',
        select: 'name email profilePicture'
      }
    });

    // Emit share update
    getIO().emit('post_shared', {
      originalPostId: originalPost._id,
      sharedPost
    });

    res.json({
      success: true,
      post: sharedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sharing post',
      error: error.message
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await post.remove();

    // Emit post deletion
    getIO().emit('post_deleted', post._id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const searchQuery = {
      $and: [
        { $text: { $search: query } },
        {
          $or: [
            { visibility: 'public' },
            { author: req.user._id }
          ]
        }
      ]
    };

    const posts = await Post.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .skip(skipIndex)
      .limit(limit)
      .populate('author', 'name email profilePicture')
      .populate('project', 'title')
      .populate('comments.user', 'name email profilePicture')
      .populate('likes.user', 'name email profilePicture');

    const total = await Post.countDocuments(searchQuery);

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
}; 