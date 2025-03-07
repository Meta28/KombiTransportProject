const express = require('express');
const app = express();
const port = 5001;
const ordersRouter = require('./routes/orders');
const path = require('path');

app.use(express.json());
// Apsolutna putanja do public foldera
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/orders', ordersRouter);

app.listen(port, () => {
  console.log(`Server radi na http://localhost:${port}`);
});