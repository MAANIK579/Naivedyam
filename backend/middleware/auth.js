const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const userId = decoded.id || decoded._id;
    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
