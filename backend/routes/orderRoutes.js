import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // Svi zahtjevi zahtijevaju autentifikaciju

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.post('/:id/submit', orderController.submitTransportRequest);

export default router;