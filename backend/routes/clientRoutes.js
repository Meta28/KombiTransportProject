import express from 'express';
import clientController from '../controllers/clientController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // Svi zahtjevi zahtijevaju autentifikaciju

router.get('/', clientController.getClients);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;