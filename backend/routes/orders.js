const express = require('express');
const axios = require('axios');

const router = express.Router();
const orders = [];

router.get('/', (req, res) => {
  res.json(orders);
});

router.post('/create', async (req, res) => {
  const { userId, date, addresses } = req.body;

  if (!userId || !date || !addresses || addresses.length < 2) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const newOrder = {
    id: orders.length + 1,
    userId,
    date,
    addresses,
    totalDistance: Math.random() * 100, // Simulated distance
    totalPrice: Math.random() * 50    // Simulated price
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

module.exports = router;
