import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use('/api', apiRouter);

// Posluživanje statičkih datoteka iz frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Posluživanje datoteka iz frontend/src
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

// Posluživanje index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Obrada grešaka
app.use((err, req, res, next) => {
    console.error('Greška:', err.stack);
    res.status(500).json({ error: 'Interna greška servera' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
});