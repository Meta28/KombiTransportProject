const bcrypt = require('bcrypt');

const password = 'test123';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash:', hash);
});