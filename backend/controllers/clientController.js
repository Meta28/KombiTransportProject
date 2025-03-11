import db from '../config/database.js';

const clientController = {
  getClients: (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM clients WHERE user_id = ?', [userId], (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Greška prilikom dohvaćanja klijenata', details: err.message });
      }
      res.json(clients);
    });
  },
  createClient: (req, res) => {
    const userId = req.user.id;
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Ime i adresa klijenta su obavezni' });
    }

    db.run(
      'INSERT INTO clients (user_id, name, address) VALUES (?, ?, ?)',
      [userId, name, address],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Greška prilikom kreiranja klijenta', details: err.message });
        }
        res.status(201).json({ id: this.lastID, user_id: userId, name, address });
      }
    );
  },
  updateClient: (req, res) => {
    const userId = req.user.id;
    const clientId = req.params.id;
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Ime i adresa klijenta su obavezni' });
    }

    db.run(
      'UPDATE clients SET name = ?, address = ? WHERE id = ? AND user_id = ?',
      [name, address, clientId, userId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Greška prilikom ažuriranja klijenta', details: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Klijent nije pronađen' });
        }
        res.json({ id: clientId, user_id: userId, name, address });
      }
    );
  },
  deleteClient: (req, res) => {
    const userId = req.user.id;
    const clientId = req.params.id;

    db.run(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [clientId, userId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Greška prilikom brisanja klijenta', details: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Klijent nije pronađen' });
        }
        res.json({ message: 'Klijent obrisan' });
      }
    );
  },
};

export default clientController;