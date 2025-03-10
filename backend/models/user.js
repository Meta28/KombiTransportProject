import db from '../config/database.js';

const User = {
  findByEmail: (email, callback) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], callback);
  },
  create: (userData, callback) => {
    const { company_name, email, password, address, warehouse_addresses = '[]' } = userData;
    db.run(
      'INSERT INTO users (company_name, email, password, address, warehouse_addresses) VALUES (?, ?, ?, ?, ?)',
      [company_name, email, password, address, warehouse_addresses],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, { id: this.lastID, ...userData });
      }
    );
  },
  update: (userId, userData, callback) => {
    const { company_name, address, warehouse_addresses } = userData;
    db.run(
      'UPDATE users SET company_name = ?, address = ?, warehouse_addresses = ? WHERE id = ?',
      [company_name, address, warehouse_addresses || '[]', userId],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, { id: userId, company_name, address, warehouse_addresses });
      }
    );
  },
  getWarehouseAddresses: (userId, callback) => {
    db.get('SELECT warehouse_addresses FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, row ? JSON.parse(row.warehouse_addresses) : []);
    });
  },
};

export default User;