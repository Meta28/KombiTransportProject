import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';

import orderRoutes from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

const app = express();

// Postavljanje __dirname za ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Omogućava CORS za frontend
app.use(express.json());

// Posluživanje statičkih datoteka iz frontend mape
app.use(express.static(path.join(__dirname, '../frontend')));

// Postavljanje ruta
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);

// API za dohvaćanje svih adresa
app.get('/api/addresses', (req, res) => {
  console.log('Fetching addresses from database...');
  db.all('SELECT * FROM addresses', [], (err, rows) => {
    if (err) {
      console.error('Error fetching addresses:', err.message);
      res.status(500).json({ error: 'Failed to fetch addresses', details: err.message });
      return;
    }
    console.log('Addresses fetched:', rows);
    res.json(rows);
  });
});

// Pokretanje servera
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});