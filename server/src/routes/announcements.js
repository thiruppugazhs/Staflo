const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

// Get announcements
router.get('/', authenticateToken, (req, res) => {
  try {
    const userDept = req.user.department || 'General';
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    let query = `
      SELECT a.*, u.name as author_name, u.role as author_role, u.avatar as author_avatar, u.department as author_department
      FROM announcements a
      JOIN users u ON a.author_id = u.id
    `;
    const params = [];

    if (!isPrivileged) {
      query += ` WHERE a.target_department = 'ALL' OR a.target_department = ?`;
      params.push(userDept);
    }

    query += ` ORDER BY a.created_at DESC`;

    const announcements = db.prepare(query).all(...params);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

// Post an announcement
router.post('/', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const { title, content, category = 'GENERAL', target_department = 'ALL' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const result = db.prepare(`
      INSERT INTO announcements (title, content, category, target_department, author_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, content, category, target_department, req.user.id);

    const announcementId = result.lastInsertRowid;

    // Send notifications to affected employees
    let targetUsers = [];
    if (target_department === 'ALL') {
      targetUsers = db.prepare('SELECT id FROM users WHERE id != ?').all(req.user.id);
    } else {
      targetUsers = db.prepare('SELECT id FROM users WHERE department = ? AND id != ?').all(target_department, req.user.id);
    }

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'INFO', '/announcements')
    `);

    targetUsers.forEach((u) => {
      insertNotif.run(u.id, `New Announcement: ${title}`, `${req.user.name} posted: ${title}`);
    });

    const announcement = db.prepare(`
      SELECT a.*, u.name as author_name, u.role as author_role, u.avatar as author_avatar
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(announcementId);

    res.status(201).json({ success: true, message: 'Announcement published successfully', announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish announcement' });
  }
});

// Delete announcement
router.delete('/:id', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const announcementId = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(announcementId);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only Admin or author can delete
    if (req.user.role !== 'ADMIN' && existing.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(announcementId);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});

module.exports = router;
