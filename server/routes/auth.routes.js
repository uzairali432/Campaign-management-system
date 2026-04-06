const express = require('express');
const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.status(501).json({ message: 'Register endpoint – not yet implemented' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Login endpoint – not yet implemented' });
});

module.exports = router;
