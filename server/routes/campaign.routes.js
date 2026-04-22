const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Campaign = require('../models/campaign.model');
const User = require('../models/user.model');

const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

const STATUS_TRANSITIONS = {
  [CAMPAIGN_STATUS.DRAFT]: [CAMPAIGN_STATUS.PENDING_APPROVAL],
  [CAMPAIGN_STATUS.PENDING_APPROVAL]: [CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.ACTIVE],
  [CAMPAIGN_STATUS.ACTIVE]: [CAMPAIGN_STATUS.PAUSED, CAMPAIGN_STATUS.COMPLETED],
  [CAMPAIGN_STATUS.PAUSED]: [CAMPAIGN_STATUS.ACTIVE, CAMPAIGN_STATUS.COMPLETED],
  [CAMPAIGN_STATUS.COMPLETED]: [],
};

const normalizeStatus = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase().replace(/\s+/g, '_');
};

const statusLabel = (status) => status.replace(/_/g, ' ');

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const toMentionHandle = (value) => normalizeText(value).replace(/[^a-z0-9]/g, '');

const toUserSnapshot = (user) => ({
  user: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const formatValueForHistory = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const parseMentions = (message) => {
  const mentionPattern = /@([a-zA-Z0-9._-]+)/g;
  const mentions = [];
  let match = mentionPattern.exec(message);

  while (match) {
    mentions.push(match[1]);
    match = mentionPattern.exec(message);
  }

  return [...new Set(mentions.map((item) => toMentionHandle(item)).filter(Boolean))];
};

const resolveMentionedUsers = async (message) => {
  const handles = parseMentions(message);

  if (handles.length === 0) {
    return [];
  }

  const users = await User.find({}).select('name email role').lean();

  return users
    .filter((user) => {
      const nameHandle = toMentionHandle(user.name);
      const emailHandle = toMentionHandle(user.email.split('@')[0]);
      return handles.includes(nameHandle) || handles.includes(emailHandle);
    })
    .map((user) => toUserSnapshot(user));
};

const ensureCollaborationCollections = (campaign) => {
  if (!Array.isArray(campaign.comments)) {
    campaign.comments = [];
  }

  if (!Array.isArray(campaign.activity)) {
    campaign.activity = [];
  }
};

const isValidTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedNext = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedNext.includes(nextStatus);
};

const canAccessCampaign = (campaign, user) => {
  if (!campaign || !user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  return String(campaign.createdBy) === String(user.id);
};

// GET /api/campaigns
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20);
    const sortBy = String(req.query.sortBy || 'createdAt').trim();
    const sortOrder = String(req.query.sortOrder || 'desc').trim().toLowerCase();
    const status = String(req.query.status || '').trim();
    const client = String(req.query.client || '').trim();
    const search = String(req.query.search || '').trim();

    if (limit > 100) {
      return res.status(400).json({ message: 'Limit must not exceed 100.' });
    }

    const allowedSortFields = new Set([
      'name',
      'client',
      'status',
      'budget',
      'spend',
      'impressions',
      'clicks',
      'conversions',
      'revenue',
      'startDate',
      'endDate',
      'createdAt',
      'updatedAt',
    ]);

    if (!allowedSortFields.has(sortBy)) {
      return res.status(400).json({ message: 'Invalid sortBy field.' });
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ message: 'sortOrder must be either asc or desc.' });
    }

    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };

    if (status && status.toLowerCase() !== 'all') {
      const normalizedStatus = normalizeStatus(status);
      if (!Object.values(CAMPAIGN_STATUS).includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid campaign status filter.' });
      }
      query.status = normalizedStatus;
    }

    if (client && client.toLowerCase() !== 'all') {
      query.client = { $regex: new RegExp(`^${escapeRegex(client)}$`, 'i') };
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = ['name', 'client', 'audience'].map((field) => ({
        [field]: { $regex: escapedSearch, $options: 'i' },
      }));
    }

    const [total, campaigns] = await Promise.all([
      Campaign.countDocuments(query),
      Campaign.find(query)
        .select('-comments -activity')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      count: campaigns.length,
      total,
      page,
      limit,
      totalPages,
      campaigns,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/campaigns/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!canAccessCampaign(campaign, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({ campaign });
  } catch (error) {
    return next(error);
  }
});

// POST /api/campaigns
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot create campaigns' });
    }

    const {
      name,
      client,
      audience,
      status,
      budget,
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      startDate,
      endDate,
    } = req.body;
    const normalizedStatus = normalizeStatus(status);

    if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
    }

    if (normalizedStatus && normalizedStatus !== CAMPAIGN_STATUS.DRAFT) {
      return res.status(400).json({
        message: `New campaigns must start as ${statusLabel(CAMPAIGN_STATUS.DRAFT)}.`,
      });
    }

    const actorSnapshot = {
      user: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    const campaign = await Campaign.create({
      name,
      client,
      audience,
      status: CAMPAIGN_STATUS.DRAFT,
      budget,
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      startDate,
      endDate,
      createdBy: req.user.id,
      activity: [
        {
          type: 'created',
          message: 'Campaign created',
          by: actorSnapshot,
        },
      ],
    });

    return res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/campaigns/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot update campaigns' });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!canAccessCampaign(campaign, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    ensureCollaborationCollections(campaign);

    const allowedUpdates = [
      'name',
      'client',
      'audience',
      'status',
      'budget',
      'spend',
      'impressions',
      'clicks',
      'conversions',
      'revenue',
      'startDate',
      'endDate',
    ];

    const actorSnapshot = {
      user: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      const nextStatus = normalizeStatus(req.body.status);

      if (!Object.values(CAMPAIGN_STATUS).includes(nextStatus)) {
        return res.status(400).json({ message: 'Invalid campaign status.' });
      }

      if (!isValidTransition(campaign.status, nextStatus)) {
        return res.status(400).json({
          message: `Invalid status transition from ${statusLabel(campaign.status)} to ${statusLabel(nextStatus)}.`,
        });
      }
    }

    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const nextValue = field === 'status' ? normalizeStatus(req.body[field]) : req.body[field];
        const currentValue = campaign[field];

        if (formatValueForHistory(currentValue) !== formatValueForHistory(nextValue)) {
          campaign.activity.push({
            type: field === 'status' ? 'status_changed' : 'field_changed',
            field,
            oldValue: formatValueForHistory(currentValue),
            newValue: formatValueForHistory(nextValue),
            message:
              field === 'status'
                ? `Status changed from ${statusLabel(currentValue)} to ${statusLabel(nextValue)}.`
                : `${field} updated.`,
            by: actorSnapshot,
          });
        }

        campaign[field] = nextValue;
      }
    });

    await campaign.save();

    return res.status(200).json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    return next(error);
  }
});

// GET /api/campaigns/:id/timeline
router.get('/:id/timeline', protect, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).select('createdBy comments activity');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!canAccessCampaign(campaign, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const comments = [...(campaign.comments || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const activity = [...(campaign.activity || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ comments, activity });
  } catch (error) {
    return next(error);
  }
});

// POST /api/campaigns/:id/comments
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!canAccessCampaign(campaign, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    ensureCollaborationCollections(campaign);

    const actorSnapshot = {
      user: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    const mentions = await resolveMentionedUsers(message);

    campaign.comments.push({
      message,
      author: actorSnapshot,
      mentions,
    });

    campaign.activity.push({
      type: 'comment_added',
      message: `Comment added${mentions.length > 0 ? ' with mentions' : ''}.`,
      mentions,
      by: actorSnapshot,
    });

    await campaign.save();

    const comment = campaign.comments[campaign.comments.length - 1];

    return res.status(201).json({
      message: 'Comment added successfully',
      comment,
      mentionsCount: mentions.length,
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot delete campaigns' });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!canAccessCampaign(campaign, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await campaign.deleteOne();

    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
