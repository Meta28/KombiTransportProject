import express from 'express';
import { config } from './config/env.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

app.use(express.json());
app.use(express.static('../public'));
app.use('/api', orderRoutes);

app.listen(config.port, () => {
    console.log(`Server radi na http://localhost:${config.port}`);
});