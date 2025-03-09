import express from 'express';
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === 'test') {
        const token = 'dummy-token-for-dev';
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka' });
    }
});

router.get('/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'dummy-token-for-dev') {
        res.json({ user: { id: 1, role: 'client', name: 'Test User' } });
    } else {
        res.status(401).json({ error: 'Neautorizirano' });
    }
});

router.get('/orders', (req, res) => {
    res.json([
        { id: 1, customerName: 'Test Kupac', deliveryDate: '2025-03-10', status: 'pending' }
    ]);
});

export { router };