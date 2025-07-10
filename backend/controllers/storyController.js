const Story = require('../models/storyModel');
const User = require('../models/userModel');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, mimetype, folder = 'nexushub_stories') => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimetype.startsWith('video/') ? 'video' : 'auto',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Media is required.' });
    }
    // Upload all media to Cloudinary
    let mediaFiles = await Promise.all(req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, file.mimetype);
      return {
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: result.secure_url,
        name: file.originalname,
        size: file.size,
        public_id: result.public_id,
      };
    }));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h expiry
    const story = await Story.create({
      user: req.user._id,
      media: mediaFiles,
      caption,
      createdAt: now,
      expiresAt
    });
    await story.populate('user', 'name email profilePicture');
    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating story', error: error.message });
  }
};

// Get all active stories (24h)
exports.getActiveStories = async (req, res) => {
  try {
    const now = new Date();
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .populate('user', 'name email profilePicture isPrivate friends followers');

    // Filter stories based on privacy/friend/follow logic
    const filteredStories = stories.filter(story => {
      const user = story.user;
      if (!user) return false;
      // Always show own stories
      if (user._id.toString() === req.user._id.toString()) return true;
      // Public profile: show if user follows
      if (!user.isPrivate) {
        return user.followers && user.followers.map(id => id.toString()).includes(req.user._id.toString());
      }
      // Private profile: show only if mutual friends
      if (user.isPrivate) {
        return user.friends && user.friends.map(id => id.toString()).includes(req.user._id.toString());
      }
      return false;
    });

    res.json({ success: true, stories: filteredStories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stories', error: error.message });
  }
};

// Get single story by id
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'name email profilePicture');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    res.json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching story', error: error.message });
  }
};

// Like/unlike a story
exports.likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    const userId = req.user._id.toString();
    const likeIndex = story.likes.findIndex(like => like.user.toString() === userId);
    const isOwner = story.user.toString() === userId;
    if (likeIndex > -1) {
      // Unlike
      story.likes.splice(likeIndex, 1);
    } else {
      // Like
      story.likes.push({ user: req.user._id, likedAt: new Date() });
      // Also add to viewers if not already
      if (!story.viewers.some(v => v.user.toString() === userId)) {
        story.viewers.push({ user: req.user._id, viewedAt: new Date() });
      }
      // --- Notification logic ---
      if (!isOwner) {
        const owner = await User.findById(story.user);
        if (owner) {
          // Prevent duplicate like notifications for the same user and story
          const alreadyNotified = owner.notifications.some(n => n.type === 'story_like' && n.from.toString() === userId && n.target.toString() === story._id.toString());
          if (!alreadyNotified) {
            owner.notifications.push({
              type: 'story_like',
              from: req.user._id,
              target: story._id,
              message: `${req.user.name || 'Someone'} liked your story`,
              createdAt: new Date(),
              read: false
            });
            // Keep only latest 100 notifications
            if (owner.notifications.length > 100) owner.notifications.shift();
            await owner.save();
          }
        }
      }
    }
    await story.save();
    res.json({ success: true, likes: story.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error liking story', error: error.message });
  }
};

// Mark story as viewed
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    const userId = req.user._id.toString();
    if (!story.viewers.some(v => v.user.toString() === userId)) {
      story.viewers.push({ user: req.user._id, viewedAt: new Date() });
      await story.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error viewing story', error: error.message });
  }
};

// Get viewers/likes list (owner only)
exports.getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('likes.user', 'name email profilePicture')
      .populate('viewers.user', 'name email profilePicture');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the story owner can view viewers/likes.' });
    }
    // Likes sorted by likedAt desc
    const likes = [...story.likes]
      .sort((a, b) => b.likedAt - a.likedAt)
      .map(like => ({ ...like.toObject(), type: 'like' }));
    // Viewers sorted by viewedAt desc, excluding those who already liked
    const likedUserIds = new Set(likes.map(l => l.user._id.toString()));
    const viewers = [...story.viewers]
      .filter(v => !likedUserIds.has(v.user._id.toString()))
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .map(viewer => ({ ...viewer.toObject(), type: 'view' }));
    // Final list: likes first, then viewers
    const result = [...likes, ...viewers];
    res.json({ success: true, viewers: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching viewers', error: error.message });
  }
};

// Add comment to a story
exports.commentOnStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    const userId = req.user._id.toString();
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
    // Add comment
    if (!story.comments) story.comments = [];
    story.comments.push({ user: req.user._id, text, createdAt: new Date() });
    await story.save();
    // --- Notification logic ---
    const isOwner = story.user.toString() === userId;
    if (!isOwner) {
      const owner = await User.findById(story.user);
      if (owner) {
        owner.notifications.push({
          type: 'story_comment',
          from: req.user._id,
          target: story._id,
          message: `${req.user.name || 'Someone'} commented on your story: ${text.substring(0, 50)}`,
          createdAt: new Date(),
          read: false
        });
        if (owner.notifications.length > 100) owner.notifications.shift();
        await owner.save();
      }
    }
    res.json({ success: true, message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error commenting on story', error: error.message });
  }
};

// Delete story (owner only)
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the story owner can delete.' });
    }
    // Optionally: delete media from Cloudinary
    for (const media of story.media) {
      if (media.public_id) {
        await cloudinary.uploader.destroy(media.public_id, { resource_type: media.type });
      }
    }
    await story.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting story', error: error.message });
  }
}; 