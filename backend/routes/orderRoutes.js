import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/authorize.js';

const router = express.Router();

// Spremanje novog transporta (naručitelj)
router.post('/orders', authenticateToken, authorizeRole('client'), (req, res) => {
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

    const orderQuery = `INSERT INTO orders (customerName, warehouse, deliveryDate, urgentDelivery, status) VALUES (?, ?, ?, ?, ?)`;
    db.run(orderQuery, [customerName, warehouse, deliveryDate, urgentDelivery ? 1 : 0, 'pending'], function(err) {
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
                res.status(201).json({ message: 'Transport uspješno spremljen', orderId });
            } catch (err) {
                db.run('ROLLBACK');
                console.error('Greška pri spremanju detalja:', err);
                res.status(500).json({ error: 'Greška pri spremanju detalja transporta' });
            }
        });
    });
});

// Prihvaćanje narudžbe (izvršitelj)
router.put('/orders/:id/accept', authenticateToken, authorizeRole('executor'), (req, res) => {
    const db = req.db;
    const orderId = req.params.id;

    db.run('UPDATE orders SET status = ? WHERE id = ?', ['accepted', orderId], function(err) {
        if (err) {
            console.error('Greška pri prihvaćanju narudžbe:', err);
            return res.status(500).json({ error: 'Greška pri prihvaćanju narudžbe' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Narudžba nije pronađena' });
        }
        res.json({ message: 'Narudžba uspješno prihvaćena' });
    });
});

// Odbijanje narudžbe (izvršitelj)
router.put('/orders/:id/reject', authenticateToken, authorizeRole('executor'), (req, res) => {
    const db = req.db;
    const orderId = req.params.id;

    db.run('UPDATE orders SET status = ? WHERE id = ?', ['rejected', orderId], function(err) {
        if (err) {
            console.error('Greška pri odbijanju narudžbe:', err);
            return res.status(500).json({ error: 'Greška pri odbijanju narudžbe' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Narudžba nije pronađena' });
        }
        res.json({ message: 'Narudžba uspješno odbijena' });
    });
});

// Dohvaćanje narudžbi (razlikuje se ovisno o ulozi)
router.get('/orders', authenticateToken, (req, res) => {
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
                    status: row.status,
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

        // Filtriranje prema ulozi
        if (req.user.role === 'client') {
            const filteredOrders = Object.values(orders).filter(order => order.customerName === req.user.name);
            res.json(filteredOrders);
        } else {
            res.json(Object.values(orders));
        }
    });
});

// Dohvaćanje pojedine narudžbe
router.get('/orders/:id', authenticateToken, (req, res) => {
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
            status: rows[0].status,
            createdAt: rows[0].createdAt,
            details: rows.map(row => ({
                address: row.address,
                weight: row.weight,
                dimensions: row.dimensions,
                article: row.article,
                sku: row.sku
            })).filter(d => d.address)
        };
        // Provjera uloge
        if (req.user.role === 'client' && order.customerName !== req.user.name) {
            return res.status(403).json({ error: 'Nedozvoljen pristup' });
        }
        res.json(order);
    });
});

// Rute za klijente
router.get('/clients/search', authenticateToken, (req, res) => {
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

router.post('/clients', authenticateToken, authorizeRole('executor'), (req, res) => {
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

router.get('/clients', authenticateToken, authorizeRole('executor'), (req, res) => {
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