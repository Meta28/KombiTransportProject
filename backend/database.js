import sqlite3 from 'sqlite3';

console.log('Initializing database...');
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1); // Zaustavi aplikaciju ako se ne može povezati na bazu
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Kreiranje tablica i umetanje početnih podataka
db.serialize(() => {
  // Kreiranje tablice za adrese
  db.run(
    `
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating addresses table:', err.message);
        process.exit(1);
      } else {
        console.log('Addresses table created or already exists.');
      }
    }
  );

  // Kreiranje tablice za narudžbe
  db.run(
    `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      warehouse_address TEXT NOT NULL,
      destination1 TEXT NOT NULL,
      destination2 TEXT,
      distance REAL NOT NULL,
      price REAL NOT NULL
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

  // Dodavanje početnih adresa
  const initialAddresses = [
    'Ulica 1, Zagreb, Croatia',
    'Ivanačićgradska ulica Zagreb, Croatia',
    'Ivane BRLIC-MAZURANIC Zagreb, Croatia',
  ];

  // Provjeravamo postoje li adrese i umećemo ih ako ne postoje
  initialAddresses.forEach((address) => {
    db.get('SELECT * FROM addresses WHERE address = ?', [address], (err, row) => {
      if (err) {
        console.error('Error checking address existence:', err.message);
        return;
      }
      if (!row) {
        db.run('INSERT INTO addresses (address) VALUES (?)', [address], (err) => {
          if (err) {
            console.error('Error inserting address:', err.message);
          } else {
            console.log(`Inserted address: ${address}`);
          }
        });
      } else {
        console.log(`Address already exists: ${address}`);
      }
    });
  });
});

export default db;