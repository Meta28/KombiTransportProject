import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET = 'tajni-kljuc'; // Mora biti isti ključ u svim dijelovima aplikacije

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login pokušaj:', { username, password });
    if (username === 'test' && password === 'test') {
        const token = jwt.sign({ username, role: 'client' }, SECRET, { expiresIn: '1h' });
        console.log('Login uspješan, token generiran:', token);
        return res.status(200).json({ token });
    }
    if (username === 'executor' && password === 'executor') {
        const token = jwt.sign({ username, role: 'executor' }, SECRET, { expiresIn: '1h' });
        console.log('Login uspješan, token generiran:', token);
        return res.status(200).json({ token });
    }
    console.log('Login neuspješan');
    res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka' });
});

router.get('/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    console.log('Profil zahtjev s Authorization header-om:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Nema tokena ili je neispravan format Authorization header-a');
        return res.status(401).json({ error: 'Nema tokena ili je neispravan format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Izvučeni token:', token);

    try {
        const decoded = jwt.verify(token, SECRET);
        console.log('Profil uspješan, korisnik:', decoded);
        res.status(200).json({ user: { username: decoded.username, role: decoded.role } });
    } catch (error) {
        console.error('Greška pri verifikaciji tokena:', error.message);
        res.status(401).json({ error: 'Nevažeći token' });
    }
});

router.get('/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    console.log('Orders zahtjev s Authorization header-om:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Nema tokena ili je neispravan format Authorization header-a');
        return res.status(401).json({ error: 'Nema tokena ili je neispravan format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Izvučeni token:', token);

    try {
        jwt.verify(token, SECRET);
        res.status(200).json([{ id: 1, customerName: 'Test Kupac' }]);
    } catch (error) {
        console.error('Greška pri verifikaciji tokena:', error.message);
        res.status(401).json({ error: 'Nevažeći token' });
    }
});

router.post('/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    console.log('Orders POST zahtjev s Authorization header-om:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Nema tokena ili je neispravan format Authorization header-a');
        return res.status(401).json({ error: 'Nema tokena ili je neispravan format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Izvučeni token:', token);

    try {
        jwt.verify(token, SECRET);
        console.log('Primljeni podaci za narudžbu:', req.body);
        // Simulacija spremanja narudžbe (u stvarnom slučaju ovo bi bilo u bazu)
        res.status(200).json({ message: 'Narudžba uspješno primljena', order: req.body });
    } catch (error) {
        console.error('Greška pri verifikaciji tokena:', error.message);
        res.status(401).json({ error: 'Nevažeći token' });
    }
});

export { router };