import express from 'express';
import userController from './controllers/userController.js';
import orderController from './controllers/orderController.js';
import clientController from './controllers/clientController.js';
import authMiddleware from './middleware/authMiddleware.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Rute koje zahtijevaju autentifikaciju
app.get('/api/clients', authMiddleware, clientController.getClients);
app.post('/api/clients', authMiddleware, clientController.createClient);
app.put('/api/clients/:id', authMiddleware, clientController.updateClient);
app.delete('/api/clients/:id', authMiddleware, clientController.deleteClient);
app.get('/api/orders', authMiddleware, orderController.getOrders);
app.post('/api/orders', authMiddleware, orderController.createOrder);
app.post('/api/orders/batch', authMiddleware, orderController.batchOrders);
app.post('/api/orders/:id/submit', authMiddleware, orderController.submitTransportRequest);
app.get('/api/users/warehouse-addresses', authMiddleware, userController.getWarehouseAddresses);
app.put('/api/users/profile', authMiddleware, userController.updateProfile);

// Rute bez autentifikacije
app.post('/api/users/register', userController.register);
app.post('/api/users/login', userController.login);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});