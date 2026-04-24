'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { addClient, removeClient } = require('../events');

// GET /api/events/campaigns
// Server-Sent Events stream for live campaign updates.
// EventSource in browsers cannot send custom request headers, so the JWT is
// accepted either from the standard Authorization header (for future use) or
// from a ?token= query parameter.
router.get('/campaigns', (req, res) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  const token =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() ||
    String(req.query.token || '').trim();

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Acknowledge the connection
  res.write('event: connected\ndata: {}\n\n');

  addClient(res);

  // Periodic heartbeat keeps the TCP connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch {
      clearInterval(heartbeat);
      removeClient(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

module.exports = router;
