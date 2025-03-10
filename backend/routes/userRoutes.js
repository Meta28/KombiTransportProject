import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/warehouse-addresses', authMiddleware, userController.getWarehouseAddresses);

export default router;