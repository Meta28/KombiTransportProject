import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Nema tokena' });

    // Privremena provjera za razvojni token
    if (token === 'dummy-token-for-dev') {
        req.user = { id: 1, role: 'client', name: 'Test User' }; // Simuliraj korisnika za test
        return next();
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ error: 'Nevažeći token' });
        req.user = user;
        next();
    });
};