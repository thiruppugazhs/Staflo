const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_hrms_secure_jwt_token_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = db.prepare('SELECT id, employee_id, name, email, role, department, designation, phone, address, avatar, joining_date, status, is_verified FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Administrator privileges required for this action' });
  }
  next();
}

function requireHrOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'HR')) {
    return res.status(403).json({ success: false, message: 'HR Officer or Administrator privileges required for this action' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireHrOrAdmin,
  JWT_SECRET,
};
