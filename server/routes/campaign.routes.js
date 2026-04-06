const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// GET /api/campaigns
router.get('/', protect, (req, res) => {
  res.status(501).json({ message: 'Get all campaigns – not yet implemented' });
});

// GET /api/campaigns/:id
router.get('/:id', protect, (req, res) => {
  res.status(501).json({ message: 'Get campaign by id – not yet implemented' });
});

// POST /api/campaigns
router.post('/', protect, (req, res) => {
  res.status(501).json({ message: 'Create campaign – not yet implemented' });
});

// PUT /api/campaigns/:id
router.put('/:id', protect, (req, res) => {
  res.status(501).json({ message: 'Update campaign – not yet implemented' });
});

// DELETE /api/campaigns/:id
router.delete('/:id', protect, (req, res) => {
  res.status(501).json({ message: 'Delete campaign – not yet implemented' });
});

module.exports = router;
