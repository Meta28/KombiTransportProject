const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const users = [];

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, email, password: hashedPassword };
  users.push(newUser);

  res.status(201).json({ message: 'User registered successfully!' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ email: user.email }, 'secret_key', { expiresIn: '1h' });
  res.json({ message: 'Login successful!', token });
});

module.exports = router;
