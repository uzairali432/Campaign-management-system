const mongoose = require('mongoose');

const userSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'viewer'],
      required: true,
    },
  },
  {
    _id: false,
  }
);

const commentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    author: {
      type: userSnapshotSchema,
      required: true,
    },
    mentions: {
      type: [userSnapshotSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['created', 'status_changed', 'field_changed', 'comment_added'],
      required: true,
    },
    field: {
      type: String,
      trim: true,
    },
    oldValue: {
      type: String,
      trim: true,
    },
    newValue: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    mentions: {
      type: [userSnapshotSchema],
      default: [],
    },
    by: {
      type: userSnapshotSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    client: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    audience: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    spend: {
      type: Number,
      min: 0,
      default: 0,
    },
    impressions: {
      type: Number,
      min: 0,
      default: 0,
    },
    clicks: {
      type: Number,
      min: 0,
      default: 0,
    },
    conversions: {
      type: Number,
      min: 0,
      default: 0,
    },
    revenue: {
      type: Number,
      min: 0,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Campaign', campaignSchema);
