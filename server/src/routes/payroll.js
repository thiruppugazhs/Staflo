const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

// Get Payroll Overview
router.get('/', authenticateToken, (req, res) => {
  try {
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    if (!isPrivileged) {
      const salary = db.prepare('SELECT * FROM salary_structures WHERE user_id = ?').get(req.user.id);
      const slips = db.prepare('SELECT * FROM payroll_slips WHERE user_id = ? ORDER BY year DESC, id DESC').all(req.user.id);
      return res.json({
        success: true,
        salary,
        slips,
      });
    }

    const { department, search } = req.query;
    let query = `
      SELECT u.id as user_id, u.employee_id, u.name, u.email, u.role, u.department, u.designation, u.avatar, u.status,
             s.basic_salary, s.hra, s.allowances, s.deductions, s.net_salary, s.updated_at as salary_updated_at
      FROM users u
      LEFT JOIN salary_structures s ON u.id = s.user_id
      WHERE u.status = 'ACTIVE'
    `;
    const params = [];

    if (department && department !== 'ALL') {
      query += ` AND u.department = ?`;
      params.push(department);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.employee_id LIKE ? OR u.designation LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY u.name ASC`;

    const records = db.prepare(query).all(...params);

    const totalMonthlyPayroll = records.reduce((acc, r) => acc + (r.net_salary || 0), 0);
    const avgSalary = records.length > 0 ? Math.round(totalMonthlyPayroll / records.length) : 0;

    res.json({
      success: true,
      records,
      summary: {
        totalMonthlyPayroll,
        avgSalary,
        totalEmployees: records.length,
      },
    });
  } catch (error) {
    console.error('Fetch payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll data' });
  }
});

// Get salary slips
router.get('/slips', authenticateToken, (req, res) => {
  try {
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const targetUserId = req.query.employeeId && isPrivileged ? parseInt(req.query.employeeId, 10) : req.user.id;

    const slips = db.prepare(`
      SELECT p.*, u.name as employee_name, u.employee_id, u.department, u.designation, u.joining_date
      FROM payroll_slips p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.year DESC, p.id DESC
    `).all(targetUserId);

    res.json({ success: true, slips });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch salary slips' });
  }
});

// Single slip detail
router.get('/slips/:id', authenticateToken, (req, res) => {
  try {
    const slipId = parseInt(req.params.id, 10);
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    const slip = db.prepare(`
      SELECT p.*, u.name as employee_name, u.employee_id, u.email, u.department, u.designation, u.phone, u.joining_date, u.address
      FROM payroll_slips p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(slipId);

    if (!slip) {
      return res.status(404).json({ success: false, message: 'Salary slip not found' });
    }

    if (!isPrivileged && req.user.id !== slip.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, slip });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch slip details' });
  }
});

// Update salary structure
router.put('/structure/:employeeId', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const { basic_salary, hra, allowances, deductions } = req.body;

    const basic = parseFloat(basic_salary) || 0;
    const h = parseFloat(hra) || 0;
    const allow = parseFloat(allowances) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = basic + h + allow - ded;

    const existing = db.prepare('SELECT id FROM salary_structures WHERE user_id = ?').get(employeeId);
    if (existing) {
      db.prepare(`
        UPDATE salary_structures
        SET basic_salary = ?, hra = ?, allowances = ?, deductions = ?, net_salary = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(basic, h, allow, ded, net, employeeId);
    } else {
      db.prepare(`
        INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)
      `).run(employeeId, basic, h, allow, ded, net);
    }

    // Send notification to employee
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Salary Structure Updated', 'Your compensation structure has been adjusted by HR/Admin.', 'INFO', '/payroll')
    `).run(employeeId);

    const updated = db.prepare('SELECT * FROM salary_structures WHERE user_id = ?').get(employeeId);
    res.json({ success: true, message: 'Salary structure updated successfully', salary: updated });
  } catch (error) {
    console.error('Update salary structure error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary structure' });
  }
});

// Generate Monthly Batch Payroll
router.post('/generate-monthly', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const { month, year = new Date().getFullYear() } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required' });
    }

    const employees = db.prepare(`
      SELECT u.id, s.basic_salary, s.hra, s.allowances, s.deductions, s.net_salary
      FROM users u
      JOIN salary_structures s ON u.id = s.user_id
      WHERE u.status = 'ACTIVE'
    `).all();

    const insertOrUpdate = db.prepare(`
      INSERT INTO payroll_slips (user_id, month, year, basic_salary, hra, allowances, deductions, net_pay, status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAID', CURRENT_DATE)
      ON CONFLICT(user_id, month, year) DO UPDATE SET
        basic_salary = excluded.basic_salary,
        hra = excluded.hra,
        allowances = excluded.allowances,
        deductions = excluded.deductions,
        net_pay = excluded.net_pay,
        status = 'PAID',
        generated_at = CURRENT_TIMESTAMP
    `);

    const notifInsert = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Monthly Salary Slip Generated', ?, 'SUCCESS', '/payroll')
    `);

    let generatedCount = 0;
    employees.forEach(emp => {
      insertOrUpdate.run(emp.id, month, year, emp.basic_salary, emp.hra, emp.allowances, emp.deductions, emp.net_salary);
      notifInsert.run(emp.id, `Your salary slip for ${month} ${year} is ready to view and download.`);
      generatedCount++;
    });

    res.json({
      success: true,
      message: `Successfully processed and generated ${generatedCount} salary slips for ${month} ${year}`,
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to process monthly payroll' });
  }
});

module.exports = router;
