const express = require('express');
const axios = require('axios');

const app = express();
const port = 5001;

// Dummy database
const orders = [];

// Middleware za parsiranje JSON-a
app.use(express.json());

// Middleware za posluživanje statičkih datoteka
app.use(express.static('public'));

// Ruta za kreiranje narudžbe
app.post('/api/orders', async (req, res) => {
  const { userId, date, addresses } = req.body;

  if (!userId || !date || !addresses || addresses.length < 2) {
    return res.status(400).json({ error: 'Invalid data. Make sure to provide userId, date, and at least two addresses.' });
  }

  try {
    // Ovo je mjesto gdje biste mogli napraviti kalkulaciju udaljenosti i troška
    // Za sada samo simuliramo podatke
    const totalDistance = 300; // primjer u kilometrima
    const totalPrice = totalDistance * 0.5;

    const newOrder = {
      id: orders.length + 1,
      userId,
      date,
      addresses,
      totalDistance,
      totalPrice,
    };

    // Spremamo narudžbu
    orders.push(newOrder);

    res.json({ message: 'Order created successfully!', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Ruta za dohvaćanje svih narudžbi
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
