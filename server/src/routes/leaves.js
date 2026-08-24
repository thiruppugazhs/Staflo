const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');
const { pushTableToSupabase } = require('../db/syncEngine');

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

    // Push to Supabase Cloud
    pushTableToSupabase('leaves');
    pushTableToSupabase('notifications');

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
      pushTableToSupabase('attendance');
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

    // Push to Supabase Cloud
    pushTableToSupabase('leaves');
    pushTableToSupabase('notifications');

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

// Get configured leave limits
router.get('/limits', authenticateToken, (req, res) => {
  try {
    const limits = db.prepare('SELECT * FROM leave_limits ORDER BY id ASC').all();
    res.json({ success: true, limits });
  } catch (error) {
    console.error('Fetch leave limits error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave limits' });
  }
});

// Update configured leave limits (Admin only)
router.put('/limits', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only System Administrators can configure leave limits.' });
    }

    const { limits } = req.body;
    if (!limits) {
      return res.status(400).json({ success: false, message: 'Limits data is required' });
    }

    const updateStmt = db.prepare('UPDATE leave_limits SET annual_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE leave_type = ?');

    if (Array.isArray(limits)) {
      for (const item of limits) {
        if (item.leave_type && item.annual_limit !== undefined) {
          updateStmt.run(parseInt(item.annual_limit, 10), item.leave_type);
        }
      }
    } else if (typeof limits === 'object') {
      for (const [code, val] of Object.entries(limits)) {
        updateStmt.run(parseInt(val, 10), code);
      }
    }

    // Push to Supabase Cloud
    pushTableToSupabase('leave_limits');

    const updated = db.prepare('SELECT * FROM leave_limits ORDER BY id ASC').all();
    res.json({ success: true, message: 'Annual leave limits updated successfully', limits: updated });
  } catch (error) {
    console.error('Update leave limits error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave limits' });
  }
});

// Leave balances (calculated using configured limits)
router.get('/balances', authenticateToken, (req, res) => {
  try {
    const targetUserId = req.query.employeeId ? parseInt(req.query.employeeId, 10) : req.user.id;

    // Load limits dynamically from leave_limits table
    const limitRows = db.prepare('SELECT * FROM leave_limits ORDER BY id ASC').all();
    const quotaMap = {
      PAID: 18,
      SICK: 12,
      CASUAL: 10,
      UNPAID: 30,
    };
    limitRows.forEach(row => {
      quotaMap[row.leave_type] = row.annual_limit;
    });

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
        total: quotaMap.PAID || 18,
        used: usedMap.PAID || 0,
        remaining: Math.max(0, (quotaMap.PAID || 18) - (usedMap.PAID || 0)),
      },
      {
        type: 'Sick Leave',
        code: 'SICK',
        total: quotaMap.SICK || 12,
        used: usedMap.SICK || 0,
        remaining: Math.max(0, (quotaMap.SICK || 12) - (usedMap.SICK || 0)),
      },
      {
        type: 'Casual Leave',
        code: 'CASUAL',
        total: quotaMap.CASUAL || 10,
        used: usedMap.CASUAL || 0,
        remaining: Math.max(0, (quotaMap.CASUAL || 10) - (usedMap.CASUAL || 0)),
      },
      {
        type: 'Unpaid Leave',
        code: 'UNPAID',
        total: quotaMap.UNPAID || 30,
        used: usedMap.UNPAID || 0,
        remaining: Math.max(0, (quotaMap.UNPAID || 30) - (usedMap.UNPAID || 0)),
      },
    ];

    res.json({ success: true, balances });
  } catch (error) {
    console.error('Calculate balances error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate leave balances' });
  }
});

module.exports = router;
