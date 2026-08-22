const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

// Helper to format current time HH:MM:SS
function getCurrentTimeStr() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

// Helper to calculate minutes between HH:MM:SS
function calculateDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1, s1 = 0] = checkIn.split(':').map(Number);
  const [h2, m2, s2 = 0] = checkOut.split(':').map(Number);
  const t1 = h1 * 60 + m1 + s1 / 60;
  const t2 = h2 * 60 + m2 + s2 / 60;
  return Math.max(0, Math.round(t2 - t1));
}

// Get Attendance Records
router.get('/', authenticateToken, (req, res) => {
  try {
    const { date, startDate, endDate, employeeId, status } = req.query;
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    let query = `
      SELECT a.id, a.user_id, a.date, a.check_in, a.check_out, a.duration_minutes, a.status, a.notes,
             u.name as employee_name, u.employee_id, u.department, u.avatar, u.designation, u.role
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If regular employee, force only their own records
    if (!isPrivileged) {
      query += ` AND a.user_id = ?`;
      params.push(req.user.id);
    } else if (employeeId) {
      query += ` AND a.user_id = ?`;
      params.push(employeeId);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND a.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (status && status !== 'ALL') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.date DESC, u.name ASC`;

    const records = db.prepare(query).all(...params);
    res.json({ success: true, records });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

// Today's status for the current user
router.get('/today', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);

    res.json({
      success: true,
      today,
      record: record || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving today attendance' });
  }
});

// Employee Check-In
router.post('/check-in', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = getCurrentTimeStr();
    const { notes = 'Web punch' } = req.body;

    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);

    if (existing && existing.check_in) {
      return res.status(400).json({ success: false, message: 'You have already checked in today' });
    }

    if (existing) {
      db.prepare(`
        UPDATE attendance
        SET check_in = ?, status = 'PRESENT', notes = ?
        WHERE id = ?
      `).run(timeStr, notes, existing.id);
    } else {
      db.prepare(`
        INSERT INTO attendance (user_id, date, check_in, status, notes)
        VALUES (?, ?, ?, 'PRESENT', ?)
      `).run(req.user.id, today, timeStr, notes);
    }

    const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
    res.json({ success: true, message: 'Checked in successfully at ' + timeStr, record });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in' });
  }
});

// Employee Check-Out
router.post('/check-out', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = getCurrentTimeStr();

    const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);

    if (!record || !record.check_in) {
      return res.status(400).json({ success: false, message: 'You must check in first before checking out' });
    }

    if (record.check_out) {
      return res.status(400).json({ success: false, message: 'You have already checked out today' });
    }

    const duration = calculateDuration(record.check_in, timeStr);
    let status = record.status;
    if (duration < 240 && duration > 0) {
      status = 'HALF_DAY';
    }

    db.prepare(`
      UPDATE attendance
      SET check_out = ?, duration_minutes = ?, status = ?
      WHERE id = ?
    `).run(timeStr, duration, status, record.id);

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(record.id);
    res.json({ success: true, message: 'Checked out successfully at ' + timeStr, record: updated });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out' });
  }
});

// HR / Admin Update Attendance Record
router.put('/:id', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const { check_in, check_out, status, notes } = req.body;
    const recordId = parseInt(req.params.id, 10);

    const current = db.prepare('SELECT * FROM attendance WHERE id = ?').get(recordId);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const newIn = check_in !== undefined ? check_in : current.check_in;
    const newOut = check_out !== undefined ? check_out : current.check_out;
    const duration = calculateDuration(newIn, newOut);
    const newStatus = status || current.status;
    const newNotes = notes !== undefined ? notes : current.notes;

    db.prepare(`
      UPDATE attendance
      SET check_in = ?, check_out = ?, duration_minutes = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(newIn, newOut, duration, newStatus, newNotes, recordId);

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(recordId);
    res.json({ success: true, message: 'Attendance record updated', record: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
});

// HR / Admin Manual Entry
router.post('/manual', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const { user_id, date, check_in, check_out, status = 'PRESENT', notes = 'Manual entry by HR' } = req.body;

    if (!user_id || !date) {
      return res.status(400).json({ success: false, message: 'User and date are required' });
    }

    const duration = calculateDuration(check_in, check_out);

    const existing = db.prepare('SELECT id FROM attendance WHERE user_id = ? AND date = ?').get(user_id, date);
    if (existing) {
      db.prepare(`
        UPDATE attendance
        SET check_in = ?, check_out = ?, duration_minutes = ?, status = ?, notes = ?
        WHERE id = ?
      `).run(check_in, check_out, duration, status, notes, existing.id);
    } else {
      db.prepare(`
        INSERT INTO attendance (user_id, date, check_in, check_out, duration_minutes, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user_id, date, check_in, check_out, duration, status, notes);
    }

    res.json({ success: true, message: 'Attendance entry saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create manual entry' });
  }
});

// Stats overview
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = db.prepare("SELECT count(*) as count FROM users WHERE status = 'ACTIVE'").get().count;

    const todayStats = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_day,
        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) as leave,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
      FROM attendance
      WHERE date = ?
    `).get(today);

    const present = todayStats.present || 0;
    const halfDay = todayStats.half_day || 0;
    const leave = todayStats.leave || 0;
    const explicitAbsent = todayStats.absent || 0;
    const recordedTotal = present + halfDay + leave + explicitAbsent;
    const notYetCheckedIn = Math.max(0, totalEmployees - recordedTotal);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        present,
        halfDay,
        leave,
        absent: explicitAbsent + notYetCheckedIn,
        attendanceRate: totalEmployees > 0 ? Math.round(((present + halfDay * 0.5) / totalEmployees) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance stats' });
  }
});

module.exports = router;
