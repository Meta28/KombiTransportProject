import express from 'express';
import { config } from './config/env.js';
import orderRoutes from './routes/orderRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serviranje statičkih datoteka iz public s ispravnim MIME tipovima
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serviranje statičkih datoteka iz frontend s ispravnim MIME tipovima
app.use('/frontend', express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serviranje index.html za korijenski URL
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'), (err) => {
        if (err) {
            console.error('Greška pri učitavanju index.html:', err);
            res.status(500).send('Neuspješno učitavanje stranice.');
        }
    });
});

app.use(express.json());
app.use('/api', orderRoutes);

// Osnovni error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Nešto je pošlo po zlu!' });
});

app.listen(config.port, () => {
    console.log(`Server radi na http://localhost:${config.port}`);
});