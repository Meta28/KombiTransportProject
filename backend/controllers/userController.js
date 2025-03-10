import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const userController = {
  register: async (req, res) => {
    const { company_name, email, password, address, warehouse_addresses = [] } = req.body;
    if (!company_name || !email || !password || !address) {
      return res.status(400).json({ error: 'Sva polja su obavezna' });
    }

    try {
      const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash)));
      });

      User.create(
        { 
          company_name, 
          email, 
          password: hashedPassword, 
          address, 
          warehouse_addresses: JSON.stringify(warehouse_addresses) 
        },
        (err, user) => {
          if (err) {
            console.error('Error creating user:', err.message); // Logiraj grešku
            return res.status(500).json({ error: 'Greška prilikom kreiranja korisnika', details: err.message });
          }
          res.status(201).json(user);
        }
      );
    } catch (err) {
      console.error('Error hashing password:', err.message); // Logiraj grešku
      return res.status(500).json({ error: 'Greška prilikom hashiranja lozinke', details: err.message });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email i lozinka su obavezni' });
    }

    try {
      const user = await new Promise((resolve, reject) => {
        User.findByEmail(email, (err, user) => (err ? reject(err) : resolve(user)));
      });

      if (!user) {
        return res.status(401).json({ error: 'Neispravni kredencijali' });
      }

      const isMatch = await new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, match) => (err ? reject(err) : resolve(match)));
      });

      if (!isMatch) {
        return res.status(401).json({ error: 'Neispravni kredencijali' });
      }

      const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
      res.json({ token, user: { id: user.id, company_name: user.company_name, email: user.email, address: user.address, warehouse_addresses: JSON.parse(user.warehouse_addresses) } });
    } catch (err) {
      console.error('Error during login:', err.message); // Logiraj grešku
      return res.status(500).json({ error: 'Greška prilikom prijave', details: err.message });
    }
  },

  updateProfile: (req, res) => {
    const userId = req.user.id;
    const { company_name, address, warehouse_addresses } = req.body;

    User.update(userId, { company_name, address, warehouse_addresses: JSON.stringify(warehouse_addresses) }, (err, updatedUser) => {
      if (err) {
        console.error('Error updating profile:', err.message); // Logiraj grešku
        return res.status(500).json({ error: 'Greška prilikom ažuriranja profila', details: err.message });
      }
      res.json({ ...updatedUser, warehouse_addresses: JSON.parse(updatedUser.warehouse_addresses) });
    });
  },

  getWarehouseAddresses: (req, res) => {
    const userId = req.user.id;
    User.getWarehouseAddresses(userId, (err, addresses) => {
      if (err) {
        console.error('Error fetching warehouse addresses:', err.message); // Logiraj grešku
        return res.status(500).json({ error: 'Greška prilikom dohvaćanja adresa skladišta', details: err.message });
      }
      res.json(addresses);
    });
  },
};

export default userController;