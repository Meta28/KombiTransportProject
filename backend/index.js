const express = require('express');
const app = express();
const port = 5001;

let orderRoutes;
try {
    orderRoutes = require('./routes/orders');
} catch (error) {
    console.error('Greška pri učitavanju routes/orders:', error.message);
    process.exit(1); // Prekini rad servera ako ruta ne uspije učitati
}

app.use(express.json());
app.use('/api', orderRoutes);

app.listen(port, () => {
    console.log(`Server radi na http://localhost:${port}`);
});