const express = require('express');
const app = express();
const port = 5001;
const path = require('path');
const ordersRouter = require('./routes/orders');

// Middleware za parsiranje JSON-a
app.use(express.json());

// Postavi put