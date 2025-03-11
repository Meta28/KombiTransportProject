import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = { id: decoded.id }; // Postavi korisnički ID u request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;