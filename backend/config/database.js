import sqlite3 from 'sqlite3';

console.log('Initializing database...');
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Kreiranje tablica
db.serialize(() => {
  // Tablica za korisnike
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      address TEXT NOT NULL,
      warehouse_addresses TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
        process.exit(1);
      } else {
        console.log('Users table created or already exists.');
      }
    }
  );

  // Tablica za klijente
  db.run(
    `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating clients table:', err.message);
        process.exit(1);
      } else {
        console.log('Clients table created or already exists.');
      }
    }
  );

  // Tablica za narudžbe (dodajemo capacity_info)
  db.run(
    `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      unique_id TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      warehouse_address TEXT NOT NULL,
      destination TEXT NOT NULL,
      weight REAL NOT NULL,
      dimensions TEXT NOT NULL,
      distance REAL NOT NULL,
      price REAL NOT NULL,
      capacity_info TEXT, -- Novo polje za informacije o kapacitetu
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
        process.exit(1);
      } else {
        console.log('Orders table created or already exists.');
      }
    }
  );

  // Tablica za račune
  db.run(
    `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating invoices table:', err.message);
        process.exit(1);
      } else {
        console.log('Invoices table created or already exists.');
      }
    }
  );

  // Umetanje testnog korisnika
  const testUser = {
    company_name: 'Test OPG',
    email: 'test@opg.com',
    password: '$2b$10$If8DwnQRO5m3oa.zPwHw..5KGYTN9s1YT.mkmjkeba3P65DGvxfjy',
    address: 'Ulica Test 1, Zagreb, Croatia',
    warehouse_addresses: JSON.stringify([{ address: 'Skladište 1, Zagreb', default: true }]),
  };

  db.get('SELECT * FROM users WHERE email = ?', [testUser.email], (err, row) => {
    if (err) {
      console.error('Error checking user existence:', err.message);
      return;
    }
    if (!row) {
      db.run(
        'INSERT INTO users (company_name, email, password, address, warehouse_addresses) VALUES (?, ?, ?, ?, ?)',
        [testUser.company_name, testUser.email, testUser.password, testUser.address, testUser.warehouse_addresses],
        (err) => {
          if (err) {
            console.error('Error inserting test user:', err.message);
          } else {
            console.log(`Inserted test user: ${testUser.email}`);
          }
        }
      );
    } else {
      console.log(`Test user already exists: ${testUser.email}`);
    }
  });
});

export default db;