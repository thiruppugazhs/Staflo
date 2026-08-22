const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

// Get Support Tickets
router.get('/tickets', authenticateToken, (req, res) => {
  try {
    const { status, category } = req.query;
    const isEmployee = req.user.role === 'EMPLOYEE';
    const isHr = req.user.role === 'HR';
    const isAdmin = req.user.role === 'ADMIN';

    let query = `
      SELECT t.*,
             u.name as employee_name, u.email as employee_email, u.employee_id, u.avatar as employee_avatar,
             u.department as employee_department,
             assigned.name as assigned_name,
             (SELECT count(*) FROM ticket_messages m WHERE m.ticket_id = t.id) as message_count
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE 1=1
    `;
    const params = [];

    if (isEmployee) {
      query += ` AND t.user_id = ?`;
      params.push(req.user.id);
    } else if (isHr) {
      if (req.user.department) {
        query += ` AND (t.department = ? OR t.department = 'General' OR t.department IS NULL)`;
        params.push(req.user.department);
      }
    }

    if (status && status !== 'ALL') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (category && category !== 'ALL') {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY t.updated_at DESC`;

    const tickets = db.prepare(query).all(...params);
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// Raise a new support query
router.post('/tickets', authenticateToken, (req, res) => {
  try {
    const { subject, category = 'OTHER', priority = 'MEDIUM', message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const dept = req.user.department || 'General';

    // Insert ticket
    const ticketResult = db.prepare(`
      INSERT INTO support_tickets (user_id, subject, category, priority, status, department)
      VALUES (?, ?, ?, ?, 'OPEN', ?)
    `).run(req.user.id, subject, category, priority, dept);

    const ticketId = ticketResult.lastInsertRowid;

    // Insert initial message in thread
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_id, message)
      VALUES (?, ?, ?)
    `).run(ticketId, req.user.id, message);

    // Notify HR of that department & Admins
    const hrUsers = db.prepare("SELECT id FROM users WHERE (role = 'HR' AND department = ?) OR role = 'ADMIN'").all(dept);
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'New Helpdesk Query', ?, 'WARNING', '/helpdesk')
    `);

    hrUsers.forEach((hr) => {
      insertNotif.run(hr.id, `${req.user.name} (${dept}) raised query: ${subject}`);
    });

    const created = db.prepare(`
      SELECT t.*, u.name as employee_name, u.avatar as employee_avatar
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(ticketId);

    res.status(201).json({ success: true, message: 'Support ticket raised successfully', ticket: created });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create support ticket' });
  }
});

// Get single ticket details and threaded messages
router.get('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = db.prepare(`
      SELECT t.*,
             u.name as employee_name, u.email as employee_email, u.employee_id, u.avatar as employee_avatar,
             u.department as employee_department,
             assigned.name as assigned_name
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isOwner = ticket.user_id === req.user.id;
    const isHrOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';

    if (!isOwner && !isHrOrAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar
      FROM ticket_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
    `).all(ticketId);

    res.json({ success: true, ticket, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load ticket details' });
  }
});

// Post message into ticket thread
router.post('/tickets/:id/messages', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isOwner = ticket.user_id === req.user.id;
    const isHrOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';

    if (!isOwner && !isHrOrAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_id, message)
      VALUES (?, ?, ?)
    `).run(ticketId, req.user.id, message.trim());

    // Update ticket timestamp
    db.prepare('UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId);

    // If HR replies and ticket was OPEN, automatically set to IN_PROGRESS
    if (isHrOrAdmin && ticket.status === 'OPEN') {
      db.prepare("UPDATE support_tickets SET status = 'IN_PROGRESS', assigned_to = ? WHERE id = ?").run(req.user.id, ticketId);
    }

    // Send notification to recipient
    if (isOwner) {
      // Notify HR
      const hrUsers = db.prepare("SELECT id FROM users WHERE (role = 'HR' AND department = ?) OR role = 'ADMIN'").all(ticket.department);
      const notif = db.prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'New Helpdesk Reply', ?, 'INFO', '/helpdesk')");
      hrUsers.forEach(h => notif.run(h.id, `${req.user.name} replied on ticket #${ticketId}: ${ticket.subject}`));
    } else {
      // Notify employee
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'HR Responded to Query', ?, 'SUCCESS', '/helpdesk')
      `).run(ticket.user_id, `${req.user.name} (${req.user.role}) replied to your query: "${ticket.subject}"`);
    }

    const newMsg = db.prepare(`
      SELECT m.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar
      FROM ticket_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'Reply sent', newMessage: newMsg });
  } catch (error) {
    console.error('Post ticket message error:', error);
    res.status(500).json({ success: false, message: 'Failed to post message' });
  }
});

// Update ticket status (HR / Admin)
router.put('/tickets/:id/status', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    db.prepare(`
      UPDATE support_tickets
      SET status = ?, assigned_to = COALESCE(assigned_to, ?), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.id, ticketId);

    // Notify employee of status update
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'INFO', '/helpdesk')
    `).run(
      ticket.user_id,
      `Support Query ${status}`,
      `Your support ticket #${ticketId} ("${ticket.subject}") has been marked as ${status}.`
    );

    const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
    res.json({ success: true, message: `Ticket status updated to ${status}`, ticket: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket status' });
  }
});

module.exports = router;
