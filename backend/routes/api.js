import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET = 'tajni-kljuc'; // Zamijeni s pravim tajnim ključem

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === 'test') {
        const token = jwt.sign({ username, role: 'client' }, SECRET, { expiresIn: '1h' }); // Uloga 'client'
        return res.json({ token });
    }
    res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka' });
});

router.get('/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Nema tokena' });

    try {
        const decoded = jwt.verify(token, SECRET);
        res.json({ user: { username: decoded.username, role: decoded.role } });
    } catch (error) {
        res.status(401).json({ error: 'Nevažeći token' });
    }
});

router.get('/orders', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Nema tokena' });

    try {
        jwt.verify(token, SECRET);
        res.json([
            { id: 1, customerName: 'Test Kupac' }
        ]);
    } catch (error) {
        res.status(401).json({ error: 'Nevažeći token' });
    }
});

export { router };