const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Campaign = require('../models/campaign.model');

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
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    return res.status(200).json({ count: campaigns.length, campaigns });
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

    const { name, client, status, budget, spend, startDate, endDate } = req.body;
    const normalizedStatus = normalizeStatus(status);

    if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
    }

    if (normalizedStatus && normalizedStatus !== CAMPAIGN_STATUS.DRAFT) {
      return res.status(400).json({
        message: `New campaigns must start as ${statusLabel(CAMPAIGN_STATUS.DRAFT)}.`,
      });
    }

    const campaign = await Campaign.create({
      name,
      client,
      status: CAMPAIGN_STATUS.DRAFT,
      budget,
      spend,
      startDate,
      endDate,
      createdBy: req.user.id,
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

    const allowedUpdates = [
      'name',
      'client',
      'status',
      'budget',
      'spend',
      'startDate',
      'endDate',
    ];

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
        campaign[field] = field === 'status' ? normalizeStatus(req.body[field]) : req.body[field];
      }
    });

    await campaign.save();

    return res.status(200).json({ message: 'Campaign updated successfully', campaign });
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
