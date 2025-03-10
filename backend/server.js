import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import orderRoutes from './routes/orderRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Postavljanje __dirname za ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Omogućava CORS za frontend
app.use(express.json());

// Posluživanje statičkih datoteka iz frontend mape
app.use(express.static(path.join(__dirname, '../frontend')));

// Postavljanje ruta
app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);

// Pokretanje servera
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});