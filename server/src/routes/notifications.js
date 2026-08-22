const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 20
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT count(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id).count;

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, req.user.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

router.put('/read-all', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;
