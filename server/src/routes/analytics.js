const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');

router.get('/summary', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalStaff = db.prepare("SELECT count(*) as count FROM users WHERE status = 'ACTIVE'").get().count;
    const totalHr = db.prepare("SELECT count(*) as count FROM users WHERE role = 'HR' AND status = 'ACTIVE'").get().count;
    const totalEmployees = db.prepare("SELECT count(*) as count FROM users WHERE role = 'EMPLOYEE' AND status = 'ACTIVE'").get().count;

    const todayAtt = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_day,
        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) as leave,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
      FROM attendance
      WHERE date = ?
    `).get(today);

    const pendingLeaves = db.prepare("SELECT count(*) as count FROM leaves WHERE status = 'PENDING'").get().count;

    const payrollSum = db.prepare(`
      SELECT SUM(net_salary) as total_net, SUM(basic_salary) as total_basic, SUM(deductions) as total_deductions
      FROM salary_structures s
      JOIN users u ON s.user_id = u.id
      WHERE u.status = 'ACTIVE'
    `).get();

    // Department Distribution
    const departmentDistribution = db.prepare(`
      SELECT department, COUNT(*) as employee_count, AVG(s.net_salary) as avg_salary, SUM(s.net_salary) as total_payroll
      FROM users u
      LEFT JOIN salary_structures s ON u.id = s.user_id
      WHERE u.status = 'ACTIVE'
      GROUP BY department
    `).all();

    // Role Breakdown
    const roleDistribution = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE status = 'ACTIVE'
      GROUP BY role
    `).all();

    // Leave Types Distribution
    const leaveTypes = db.prepare(`
      SELECT leave_type, COUNT(*) as count, SUM(total_days) as total_days
      FROM leaves
      GROUP BY leave_type
    `).all();

    // Weekly Attendance Trend (past 7 days)
    const weeklyAttendance = db.prepare(`
      SELECT date,
             SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_day,
             SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) as leave,
             SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `).all().reverse();

    res.json({
      success: true,
      stats: {
        totalStaff,
        totalHr,
        totalEmployees,
        presentToday: todayAtt.present || 0,
        halfDayToday: todayAtt.half_day || 0,
        onLeaveToday: todayAtt.leave || 0,
        pendingLeaves,
        totalMonthlyPayroll: payrollSum.total_net || 0,
        totalMonthlyDeductions: payrollSum.total_deductions || 0,
        attendanceRate: totalStaff > 0 ? Math.round(((todayAtt.present || 0) + (todayAtt.half_day || 0) * 0.5) / totalStaff * 100) : 0,
      },
      departmentDistribution,
      roleDistribution,
      leaveTypes,
      weeklyAttendance,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate analytics' });
  }
});

module.exports = router;
