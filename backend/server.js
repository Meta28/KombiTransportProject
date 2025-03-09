import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware za JSON i CORS
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5001',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// API rute
app.use('/api', apiRouter);

// Posluživanje statičkih datoteka
app.use(express.static(path.join(__dirname, '../frontend/public'), {
    setHeaders: (res) => {
        if (res.req.path.endsWith('.html')) {
            res.set('Content-Type', 'text/html');
        } else if (res.req.path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        } else if (res.req.path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        }
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.use((req, res, next) => {
    if (req.path.startsWith('/lib/') && !res.headersSent) {
        res.status(404).send('Datoteka nije pronađena');
    } else {
        next();
    }
});

app.use((err, req, res, next) => {
    console.error('Greška:', err.stack);
    res.status(500).json({ error: 'Interna greška servera' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
});