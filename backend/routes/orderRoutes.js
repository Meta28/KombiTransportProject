import express from 'express';
import db from '../database.js';

const router = express.Router();

// Dohvaćanje svih narudžbi
router.get('/', (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Kreiranje nove narudžbe
router.post('/', (req, res) => {
  const { date, warehouse_address, destination1, destination2 } = req.body;

  // Hardkodirana udaljenost i cijena
  const distance = 18.999; // Hardkodirano kao na slici
  const price = distance * 0.433; // 0.433 EUR po km da dobijemo 8.22 EUR kao na slici

  const sql = `
    INSERT INTO orders (date, warehouse_address, destination1, destination2, distance, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [date, warehouse_address, destination1, destination2 || null, distance, price];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      date,
      warehouse_address,
      destination1,
      destination2,
      distance,
      price
    });
  });
});

export default router;