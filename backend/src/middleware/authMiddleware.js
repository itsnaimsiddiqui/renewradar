const { verifyToken } = require('../services/authService');

function authMiddleware(req, res, next) {
  // Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to RenewRadar.'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }

  req.user = payload;
  next();
}

module.exports = authMiddleware;
