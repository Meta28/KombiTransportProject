import express from 'express';
const router = express.Router();

// Generiranje i spremanje fakture za transport
router.post('/invoices', (req, res) => {
    const { orderId, customerName, customerOIB, customerAddress, executorName, executorOIB, executorAddress } = req.body;
    const db = req.db;

    if (!orderId || !customerName || !customerAddress) {
        return res.status(400).json({ error: 'Nedostaju obavezni podaci za fakturu' });
    }

    // Dobivanje podataka o transportu
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err || !order) {
            console.error('Greška pri dohvaćanju transporta:', err);
            return res.status(404).json({ error: 'Transport nije pronađen' });
        }

        // Generiranje broja fakture (npr. 2025/001, 2025/002, itd.)
        const currentYear = new Date().getFullYear();
        db.get('SELECT COUNT(*) as count FROM invoices WHERE invoiceNumber LIKE ?', [`${currentYear}/%`], (err, row) => {
            if (err) {
                console.error('Greška pri brojanju faktura:', err);
                return res.status(500).json({ error: 'Greška pri generiranju broja fakture' });
            }
            const invoiceNumber = `${currentYear}/${String(row.count + 1).padStart(3, '0')}`;
            const issueDate = new Date().toISOString().split('T')[0];
            const dueDate = new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]; // Rok plaćanja 14 dana
            const paymentReference = order.id.toString().padStart(10, '0'); // Poziv na broj = ID transporta
            const serviceDescription = `Transport usluga za transport #${orderId}`;
            const amountWithoutVAT = 100.00; // Primjer iznos (može se prilagoditi)
            const vatRate = 0.25; // Stopa PDV-a 25%
            const vatAmount = amountWithoutVAT * vatRate;
            const totalAmount = amountWithoutVAT + vatAmount;

            const query = `
                INSERT INTO invoices (orderId, invoiceNumber, issueDate, dueDate, customerName, customerOIB, customerAddress, executorName, executorOIB, executorAddress, serviceDescription, amountWithoutVAT, vatRate, vatAmount, totalAmount, paymentReference)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(query, [
                orderId, invoiceNumber, issueDate, dueDate, customerName, customerOIB || null, customerAddress, executorName || 'Kombi Transport d.o.o.', executorOIB || '12345678901', executorAddress || 'Ulica Primjera 1, 10000 Zagreb', serviceDescription, amountWithoutVAT, vatRate, vatAmount, totalAmount, paymentReference
            ], function(err) {
                if (err) {
                    console.error('Greška pri spremanju fakture:', err);
                    return res.status(500).json({ error: 'Greška pri spremanju fakture' });
                }
                // Vraćamo cijeli objekt fakture
                const invoice = {
                    id: this.lastID,
                    orderId,
                    invoiceNumber,
                    issueDate,
                    dueDate,
                    customerName,
                    customerOIB: customerOIB || null,
                    customerAddress,
                    executorName: executorName || 'Kombi Transport d.o.o.',
                    executorOIB: executorOIB || '12345678901',
                    executorAddress: executorAddress || 'Ulica Primjera 1, 10000 Zagreb',
                    serviceDescription,
                    amountWithoutVAT,
                    vatRate,
                    vatAmount,
                    totalAmount,
                    paymentReference,
                    createdAt: new Date().toISOString()
                };
                res.status(201).json({ message: 'Faktura uspješno generirana', invoice });
            });
        });
    });
});

// Dohvaćanje popisa faktura
router.get('/invoices', (req, res) => {
    const db = req.db;
    db.all('SELECT * FROM invoices ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
            console.error('Greška pri dohvaćanju faktura:', err);
            return res.status(500).json({ error: 'Greška pri dohvaćanju faktura' });
        }
        res.json(rows);
    });
});

// Dohvaćanje pojedinog fakture
router.get('/invoices/:id', (req, res) => {
    const db = req.db;
    const invoiceId = req.params.id;
    db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId], (err, row) => {
        if (err) {
            console.error('Greška pri dohvaćanju fakture:', err);
            return res.status(500).json({ error: 'Greška pri dohvaćanju fakture' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Faktura nije pronađena' });
        }
        res.json(row);
    });
});

export default router;