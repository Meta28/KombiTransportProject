const jwt = require('jsonwebtoken');

// Middleware za provjeru JWT tokena
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Pristup odbijen. Token nije dostavljen.' });
  }

  jwt.verify(token, 'tajni_kljuc', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token nije važeći.' });
    }

    req.user = user;
    next();
  });
}

module.exports = verifyToken;
