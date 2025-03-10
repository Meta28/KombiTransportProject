import Order from '../models/order.js';
import db from '../config/database.js';

const orderController = {
  getOrders: (req, res) => {
    const userId = req.user.id;
    Order.findByUserId(userId, (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Greška prilikom dohvaćanja narudžbi', details: err.message });
      }
      res.json(orders.map(order => ({
        ...order,
        capacity_info: order.capacity_info ? JSON.parse(order.capacity_info) : null,
      })));
    });
  },
  createOrder: (req, res) => {
    const userId = req.user.id;
    const { client_id, date, warehouse_address, destination, weight, dimensions } = req.body;

    if (!client_id || !date || !warehouse_address || !destination || !weight || !dimensions) {
      return res.status(400).json({ error: 'Sva polja su obavezna' });
    }

    const orderData = {
      user_id: userId,
      client_id,
      date,
      warehouse_address,
      destination,
      weight,
      dimensions,
    };

    Order.create(orderData, (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Greška prilikom kreiranja narudžbe', details: err.message });
      }
      res.status(201).json({
        ...order,
        capacity_info: order.capacity_info ? JSON.parse(order.capacity_info) : null,
      });
    });
  },
  submitTransportRequest: (req, res) => {
    const orderId = req.params.id;
    const userId = req.user.id;

    Order.updateStatus(orderId, 'submitted', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Greška prilikom podnošenja zahtjeva za transport', details: err.message });
      }

      db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err || !order) {
          return res.status(500).json({ error: 'Greška prilikom dohvaćanja narudžbe', details: err?.message });
        }

        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
          if (err || !user) {
            return res.status(500).json({ error: 'Greška prilikom dohvaćanja korisnika', details: err?.message });
          }

          db.get('SELECT * FROM clients WHERE id = ?', [order.client_id], (err, client) => {
            if (err || !client) {
              return res.status(500).json({ error: 'Greška prilikom dohvaćanja klijenta', details: err?.message });
            }

            const amount = order.price;
            const issuanceDate = new Date().toISOString().split('T')[0];
            const dueDate = new Date(new Date().setDate(new Date().getDate() + 8)).toISOString().split('T')[0];
            const vatRate = 0.25;
            const vatAmount = amount * vatRate;
            const totalAmount = amount + vatAmount;

            const paymentDetails = {
              method: 'virman',
              account: 'HR1234567890123456',
              recipient: user.company_name,
              amount: totalAmount.toFixed(2),
              reference: order.unique_id,
              issuanceDate,
              dueDate,
              vatRate: '25%',
              vatAmount: vatAmount.toFixed(2),
            };

            db.run(
              `
              INSERT INTO invoices (order_id, user_id, amount, payment_method, payment_details)
              VALUES (?, ?, ?, ?, ?)
              `,
              [orderId, userId, totalAmount, 'virman', JSON.stringify(paymentDetails)],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: 'Greška prilikom kreiranja fakture', details: err.message });
                }
                res.json({
                  message: 'Zahtjev za transport podnesen',
                  invoice: {
                    order_id: orderId,
                    user_id: userId,
                    ...paymentDetails,
                    issuer: `${user.company_name}, ${user.address}`,
                    recipient: `${client.name}, ${client.address}`,
                    description: `Dostava transporta (${order.distance} km, ${order.weight} kg)`,
                    quantity: '1',
                    unitPrice: order.price.toFixed(2),
                  },
                });
              }
            );
          });
        });
      });
    });
  },
};

export default orderController;