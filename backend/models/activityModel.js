const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'completed', 'commented', 'assigned', 'joined']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['project', 'task', 'comment', 'attachment', 'team']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
activitySchema.index({ projectId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);