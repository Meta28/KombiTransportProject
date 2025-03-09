import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.js'; // Dodaj ovaj uvoz

const router = express.Router();
const saltRounds = 10;

// Registracija korisnika
router.post('/register', (req, res) => {
    const { username, password, role, name, oib, address } = req.body;
    const db = req.db;

    if (!username || !password || !role || !name) {
        return res.status(400).json({ error: 'Sva polja su obavezna' });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Greška pri hashiranju lozinke:', err);
            return res.status(500).json({ error: 'Greška pri registraciji' });
        }

        const query = `INSERT INTO users (username, password, role, name, oib, address) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(query, [username, hash, role, name, oib || null, address || null], function(err) {
            if (err) {
                console.error('Greška pri spremanju korisnika:', err);
                return res.status(500).json({ error: 'Greška pri registraciji' });
            }
            res.status(201).json({ message: 'Korisnik uspješno registriran', userId: this.lastID });
        });
    });
});

// Prijava korisnika
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = req.db;

    if (!username || !password) {
        return res.status(400).json({ error: 'Korisničko ime i lozinka su obavezni' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            console.error('Greška pri dohvaćanju korisnika:', err);
            return res.status(404).json({ error: 'Korisnik nije pronađen' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka' });
            }

            const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, config.jwtSecret, { expiresIn: '1h' });
            res.json({ message: 'Prijava uspješna', token });
        });
    });
});

// Zaštićena ruta za profil
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

export default router;