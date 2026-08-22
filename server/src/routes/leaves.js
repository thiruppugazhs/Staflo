const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

// Get Leaves
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    let query = `
      SELECT l.id, l.user_id, l.leave_type, l.start_date, l.end_date, l.total_days,
             l.reason, l.status, l.admin_comment, l.reviewed_at, l.created_at,
             u.name as employee_name, u.employee_id, u.department, u.avatar, u.role,
             reviewer.name as reviewer_name
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN users reviewer ON l.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params = [];

    if (!isPrivileged) {
      query += ` AND l.user_id = ?`;
      params.push(req.user.id);
    } else if (employeeId) {
      query += ` AND l.user_id = ?`;
      params.push(employeeId);
    }

    if (status && status !== 'ALL') {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY l.created_at DESC`;

    const leaves = db.prepare(query).all(...params);
    res.json({ success: true, leaves });
  } catch (error) {
    console.error('Fetch leaves error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves' });
  }
});

// Apply for Leave
router.post('/', authenticateToken, (req, res) => {
  try {
    const { leave_type, start_date, end_date, total_days, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const days = parseInt(total_days, 10) || 1;

    const result = db.prepare(`
      INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(req.user.id, leave_type, start_date, end_date, days, reason);

    const newLeaveId = result.lastInsertRowid;

    // Send notification to all HRs & Admins
    const managers = db.prepare("SELECT id FROM users WHERE role IN ('ADMIN', 'HR')").all();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'New Leave Request', ?, 'WARNING', '/leaves')
    `);

    managers.forEach(mgr => {
      insertNotif.run(mgr.id, `${req.user.name} submitted a ${days}-day ${leave_type} leave request.`);
    });

    const leave = db.prepare(`
      SELECT l.*, u.name as employee_name, u.employee_id, u.department, u.avatar
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(newLeaveId);

    res.status(201).json({ success: true, message: 'Leave application submitted successfully', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit leave application' });
  }
});

// HR / Admin Approve or Reject Leave
router.put('/:id/status', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const { status, admin_comment = '' } = req.body;
    const leaveId = parseInt(req.params.id, 10);

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    db.prepare(`
      UPDATE leaves
      SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, admin_comment, req.user.id, leaveId);

    if (status === 'APPROVED') {
      db.prepare(`
        INSERT OR REPLACE INTO attendance (user_id, date, status, notes)
        VALUES (?, ?, 'LEAVE', ?)
      `).run(leave.user_id, leave.start_date, `Approved ${leave.leave_type} Leave: ${leave.reason}`);
    }

    // Send notification to employee
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, '/leaves')
    `).run(
      leave.user_id,
      `Leave Request ${status}`,
      `Your ${leave.leave_type} leave request from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.${admin_comment ? ` Remarks: ${admin_comment}` : ''}`,
      status === 'APPROVED' ? 'SUCCESS' : 'ALERT'
    );

    const updated = db.prepare(`
      SELECT l.*, u.name as employee_name, u.employee_id, u.department, u.avatar,
             reviewer.name as reviewer_name
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN users reviewer ON l.reviewed_by = reviewer.id
      WHERE l.id = ?
    `).get(leaveId);

    res.json({ success: true, message: `Leave request has been ${status.toLowerCase()}`, leave: updated });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave status' });
  }
});

// Leave balances
router.get('/balances', authenticateToken, (req, res) => {
  try {
    const targetUserId = req.query.employeeId ? parseInt(req.query.employeeId, 10) : req.user.id;

    const quotas = {
      PAID: 18,
      SICK: 12,
      CASUAL: 6,
      UNPAID: 30,
    };

    const usedLeaves = db.prepare(`
      SELECT leave_type, SUM(total_days) as used_days
      FROM leaves
      WHERE user_id = ? AND status = 'APPROVED'
      GROUP BY leave_type
    `).all(targetUserId);

    const usedMap = {};
    usedLeaves.forEach(item => {
      usedMap[item.leave_type] = item.used_days;
    });

    const balances = [
      {
        type: 'Paid Leave',
        code: 'PAID',
        total: quotas.PAID,
        used: usedMap.PAID || 0,
        remaining: Math.max(0, quotas.PAID - (usedMap.PAID || 0)),
      },
      {
        type: 'Sick Leave',
        code: 'SICK',
        total: quotas.SICK,
        used: usedMap.SICK || 0,
        remaining: Math.max(0, quotas.SICK - (usedMap.SICK || 0)),
      },
      {
        type: 'Casual Leave',
        code: 'CASUAL',
        total: quotas.CASUAL,
        used: usedMap.CASUAL || 0,
        remaining: Math.max(0, quotas.CASUAL - (usedMap.CASUAL || 0)),
      },
      {
        type: 'Unpaid Leave',
        code: 'UNPAID',
        total: quotas.UNPAID,
        used: usedMap.UNPAID || 0,
        remaining: Math.max(0, quotas.UNPAID - (usedMap.UNPAID || 0)),
      },
    ];

    res.json({ success: true, balances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to calculate leave balances' });
  }
});

module.exports = router;
