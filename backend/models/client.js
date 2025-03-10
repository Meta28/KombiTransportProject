import db from '../config/database.js';

const Client = {
  findByUserId: (userId, callback) => {
    db.all('SELECT * FROM clients WHERE user_id = ?', [userId], callback);
  },
  create: (clientData, callback) => {
    const { user_id, name, address } = clientData;
    db.run(
      'INSERT INTO clients (user_id, name, address) VALUES (?, ?, ?)',
      [user_id, name, address],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, { id: this.lastID, user_id, name, address });
      }
    );
  },
  update: (clientId, clientData, callback) => {
    const { name, address } = clientData;
    db.run(
      'UPDATE clients SET name = ?, address = ? WHERE id = ?',
      [name, address, clientId],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, { id: clientId, name, address });
      }
    );
  },
  delete: (clientId, callback) => {
    db.run('DELETE FROM clients WHERE id = ?', [clientId], callback);
  },
};

export default Client;