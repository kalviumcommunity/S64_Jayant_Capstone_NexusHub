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
      .populate('user', 'name email profilePicture');
    res.json({ success: true, stories });
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