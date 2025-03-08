import express from 'express';
import { config } from './config/env.js';
import orderRoutes from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Povezivanje s SQLite bazom
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Greška pri povezivanju s bazom:', err);
    } else {
        console.log('Povezan s SQLite bazom');
    }
});

// Proslijedi bazu u request objekt
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Serviranje statičkih datoteka
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        else if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
}));

app.use('/frontend', express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        else if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
}));

// Rute za različite stranice
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'), (err) => {
        if (err) {
            console.error('Greška pri učitavanju index.html:', err);
            res.status(500).send('Neuspješno učitavanje stranice.');
        }
    });
});

app.get('/naruci-transport', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'), (err) => {
        if (err) {
            console.error('Greška pri učitavanju index.html:', err);
            res.status(500).send('Neuspješno učitavanje stranice.');
        }
    });
});

app.use(express.json());
app.use('/api', orderRoutes);
app.use('/api', invoiceRoutes); // Osiguravamo da se rute za fakture koriste

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Nešto je pošlo po zlu!' });
});

app.listen(config.port, () => {
    console.log(`Server radi na http://localhost:${config.port}`);
});

// Zatvori bazu pri gašenju
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error('Greška pri zatvaranju baze:', err);
        console.log('Baza zatvorena, server se gasi.');
        process.exit(0);
    });
});