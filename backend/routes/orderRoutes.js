import express from 'express';
const router = express.Router();

// Spremanje novog transporta s detaljima i generiranje fakture
router.post('/orders', (req, res) => {
    const { customerName, warehouse, deliveryDate, addresses, urgentDelivery, customerOIB, customerAddress, executorName, executorOIB, executorAddress } = req.body;
    const db = req.db;

    if (!customerName || !warehouse || !deliveryDate || !Array.isArray(addresses)) {
        return res.status(400).json({ error: 'Sva polja su obavezna, uključujući datum dostave i niz adresa' });
    }

    const validAddresses = addresses.map(addr => ({
        address: addr.address || '',
        weight: parseFloat(addr.weight) || 0,
        dimensions: addr.dimensions || '',
        article: addr.article || '',
        sku: addr.sku || ''
    })).filter(addr => addr.address.trim() !== '');

    if (validAddresses.length === 0) {
        return res.status(400).json({ error: 'Bar jedna adresa dostave je obavezna' });
    }

    const clientQuery = `INSERT OR IGNORE INTO clients (name, address) VALUES (?, ?)`;
    db.run(clientQuery, [customerName, validAddresses[0].address || null]);

    const orderQuery = `INSERT INTO orders (customerName, warehouse, deliveryDate, urgentDelivery) VALUES (?, ?, ?, ?)`;
    db.run(orderQuery, [customerName, warehouse, deliveryDate, urgentDelivery ? 1 : 0], function(err) {
        if (err) {
            console.error('Greška pri spremanju transporta:', err);
            return res.status(500).json({ error: 'Greška pri spremanju transporta' });
        }
        const orderId = this.lastID;

        const detailQueries = validAddresses.map(() => `
            INSERT INTO order_details (orderId, address, weight, dimensions, article, sku)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const detailValues = validAddresses.flatMap(addr => [
            orderId, addr.address, addr.weight, addr.dimensions, addr.article, addr.sku
        ]);

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            try {
                detailQueries.forEach((query, index) => {
                    db.run(query, [
                        orderId,
                        validAddresses[index].address,
                        validAddresses[index].weight,
                        validAddresses[index].dimensions,
                        validAddresses[index].article,
                        validAddresses[index].sku
                    ]);
                });
                db.run('COMMIT');

                // Generiranje fakture nakon uspješnog spremanja transporta
                const invoiceData = {
                    orderId,
                    customerName,
                    customerOIB,
                    customerAddress,
                    executorName: executorName || 'Kombi Transport d.o.o.',
                    executorOIB: executorOIB || '12345678901',
                    executorAddress: executorAddress || 'Ulica Primjera 1, 10000 Zagreb'
                };
                fetch('http://localhost:5001/api/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                })
                .then(response => response.json())
                .then(invoiceResponse => {
                    res.status(201).json({ message: 'Transport uspješno spremljen', orderId, invoice: invoiceResponse.invoice });
                })
                .catch(error => {
                    console.error('Greška pri generiranju fakture:', error);
                    res.status(201).json({ message: 'Transport uspješno spremljen', orderId, invoiceError: 'Greška pri generiranju fakture' });
                });
            } catch (err) {
                db.run('ROLLBACK');
                console.error('Greška pri spremanju detalja:', err);
                res.status(500).json({ error: 'Greška pri spremanju detalja transporta' });
            }
        });
    });
});

// Ostale rute (GET /orders, GET /orders/:id) ostaju nepromijenjene
router.get('/orders/:id', (req, res) => {
    const db = req.db;
    const orderId = req.params.id;
    const query = `
        SELECT o.*, od.*
        FROM orders o
        LEFT JOIN order_details od ON o.id = od.orderId
        WHERE o.id = ?
    `;
    db.all(query, [orderId], (err, rows) => {
        if (err) {
            console.error('Greška pri dohvaćanju transporta:', err);
            return res.status(500).json({ error: 'Greška pri dohvaćanju transporta' });
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Transport nije pronađen' });
        }
        const order = {
            id: rows[0].id,
            customerName: rows[0].customerName,
            warehouse: rows[0].warehouse,
            deliveryDate: rows[0].deliveryDate,
            urgentDelivery: rows[0].urgentDelivery === 1,
            createdAt: rows[0].createdAt,
            details: rows.map(row => ({
                address: row.address,
                weight: row.weight,
                dimensions: row.dimensions,
                article: row.article,
                sku: row.sku
            })).filter(d => d.address)
        };
        res.json(order);
    });
});

router.get('/orders', (req, res) => {
    const db = req.db;
    const query = `
        SELECT o.*, od.*
        FROM orders o
        LEFT JOIN order_details od ON o.id = od.orderId
        ORDER BY o.createdAt DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Greška pri dohvaćanju transporta:', err);
            return res.status(500).json({ error: 'Greška pri dohvaćanju transporta' });
        }
        const orders = {};
        rows.forEach(row => {
            if (!orders[row.id]) {
                orders[row.id] = {
                    id: row.id,
                    customerName: row.customerName,
                    warehouse: row.warehouse,
                    deliveryDate: row.deliveryDate,
                    urgentDelivery: row.urgentDelivery === 1,
                    createdAt: row.createdAt,
                    details: []
                };
            }
            if (row.orderId) {
                orders[row.id].details.push({
                    address: row.address,
                    weight: row.weight,
                    dimensions: row.dimensions,
                    article: row.article,
                    sku: row.sku
                });
            }
        });
        res.json(Object.values(orders));
    });
});

// Ostale rute (clients) ostaju nepromijenjene
router.get('/clients/search', (req, res) => {
    const db = req.db;
    const name = req.query.name || '';
    const query = `SELECT * FROM clients WHERE name LIKE ? LIMIT 5`;
    db.all(query, [`%${name}%`], (err, rows) => {
        if (err) {
            console.error('Greška pri pretraživanju klijenata:', err);
            return res.status(500).json({ error: 'Greška pri pretraživanju klijenata' });
        }
        res.json(rows);
    });
});

router.post('/clients', (req, res) => {
    const { name, phone, email, address } = req.body;
    const db = req.db;

    if (!name) {
        return res.status(400).json({ error: 'Ime klijenta je obavezno' });
    }

    const query = `INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, phone || null, email || null, address || null], function(err) {
        if (err) {
            console.error('Greška pri kreiranju klijenta:', err);
            return res.status(500).json({ error: 'Greška pri kreiranju klijenta' });
        }
        res.status(201).json({ message: 'Klijent uspješno kreiran', clientId: this.lastID });
    });
});

router.get('/clients', (req, res) => {
    const db = req.db;
    const query = `SELECT * FROM clients ORDER BY createdAt DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Greška pri dohvaćanju klijenata:', err);
            return res.status(500).json({ error: 'Greška pri dohvaćanju klijenata' });
        }
        res.json(rows);
    });
});

export default router;