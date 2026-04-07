const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Campaign = require('../models/campaign.model');

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

    if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
    }

    const campaign = await Campaign.create({
      name,
      client,
      status,
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

    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        campaign[field] = req.body[field];
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
