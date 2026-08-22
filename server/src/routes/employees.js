const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireHrOrAdmin } = require('../middleware/auth');
const { sendWelcomeCredentialsEmail } = require('../services/emailService');

// Get Employees Directory
router.get('/', authenticateToken, (req, res) => {
  try {
    const { department, role, search, status } = req.query;

    let query = `
      SELECT u.id, u.employee_id, u.name, u.email, u.role, u.department, u.designation,
             u.phone, u.address, u.avatar, u.joining_date, u.status, u.created_at, u.must_change_password,
             s.basic_salary, s.hra, s.allowances, s.deductions, s.net_salary
      FROM users u
      LEFT JOIN salary_structures s ON u.id = s.user_id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'ALL') {
      query += ` AND u.department = ?`;
      params.push(department);
    }

    if (role && role !== 'ALL') {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== 'ALL') {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ? OR u.designation LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY u.id ASC`;

    const employees = db.prepare(query).all(...params);

    // If regular employee is viewing directory, hide detailed salary figures
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const sanitized = employees.map(emp => {
      if (!isPrivileged && emp.id !== req.user.id) {
        const { basic_salary, hra, allowances, deductions, net_salary, ...rest } = emp;
        return rest;
      }
      return emp;
    });

    res.json({ success: true, employees: sanitized });
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get Single Employee Profile
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const isSelf = req.user.id === requestedId;
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    const user = db.prepare(`
      SELECT id, employee_id, name, email, role, department, designation,
             phone, address, avatar, joining_date, status, created_at, must_change_password
      FROM users WHERE id = ?
    `).get(requestedId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let salary = null;
    if (isPrivileged || isSelf) {
      salary = db.prepare('SELECT * FROM salary_structures WHERE user_id = ?').get(requestedId);
    }

    const documents = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY upload_date DESC').all(requestedId);
    const recentAttendance = db.prepare('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 7').all(requestedId);
    const recentLeaves = db.prepare('SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(requestedId);

    res.json({
      success: true,
      employee: user,
      salary,
      documents,
      recentAttendance,
      recentLeaves,
    });
  } catch (error) {
    console.error('Get employee detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve employee profile' });
  }
});

// Create Employee / HR
router.post('/', authenticateToken, requireHrOrAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      phone = '',
      password,
      role = 'EMPLOYEE',
      department = 'General',
      designation = 'Staff Member',
      address = '',
      avatar = '',
      joining_date = new Date().toISOString().split('T')[0],
      basic_salary = 5000,
      hra = 1500,
      allowances = 1000,
      deductions = 800,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const creatorRole = req.user.role;
    const targetRole = (role || 'EMPLOYEE').toUpperCase();
    let assignedDepartment = department;

    // Rule 1: HR can ONLY create EMPLOYEE role
    if (creatorRole === 'HR') {
      if (targetRole === 'HR' || targetRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: HR Officers can only onboard standard Employees. Only Administrators can create HR accounts.',
        });
      }

      // Rule 2: HR can ONLY create employees within their own assigned department
      if (req.user.department && department !== req.user.department) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: As HR for ${req.user.department}, you can only onboard employees into the ${req.user.department} department.`,
        });
      }
      assignedDepartment = req.user.department || department;
    }

    if (creatorRole === 'ADMIN') {
      if (!['HR', 'EMPLOYEE', 'ADMIN'].includes(targetRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const prefix = targetRole === 'ADMIN' ? 'ADM' : targetRole === 'HR' ? 'HR' : 'EMP';
    const count = db.prepare('SELECT count(*) as count FROM users WHERE role = ?').get(targetRole).count;
    const employee_id = `${prefix}-${String(count + 1).padStart(3, '0')}`;

    // Mobile Number is used as the initial temporary password
    const rawTempPassword = phone && phone.trim() ? phone.trim() : (password || '1234567890');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(rawTempPassword, salt);

    const userResult = db.prepare(`
      INSERT INTO users (employee_id, name, email, password, role, department, designation, phone, address, avatar, joining_date, status, is_verified, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, 1)
    `).run(
      employee_id,
      name,
      email,
      hashedPassword,
      targetRole,
      assignedDepartment,
      designation,
      phone,
      address,
      avatar || '', // Clean by default (no pre-seeded default photo)
      joining_date
    );

    const userId = userResult.lastInsertRowid;
    const basic = parseFloat(basic_salary) || 0;
    const h = parseFloat(hra) || 0;
    const allow = parseFloat(allowances) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = basic + h + allow - ded;

    db.prepare(`
      INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)
    `).run(userId, basic, h, allow, ded, net);

    // Welcome Notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Welcome to Daily Flow', 'Your account has been created. Please change your temporary password upon login.', 'WARNING', '/dashboard')
    `).run(userId);

    const newEmployee = db.prepare(`
      SELECT u.id, u.employee_id, u.name, u.email, u.role, u.department, u.designation,
             u.phone, u.address, u.avatar, u.joining_date, u.status, u.must_change_password,
             s.basic_salary, s.hra, s.allowances, s.deductions, s.net_salary
      FROM users u
      LEFT JOIN salary_structures s ON u.id = s.user_id
      WHERE u.id = ?
    `).get(userId);

    // Dispatch Welcome Credentials Email (awaited for guaranteed cloud delivery)
    const emailResult = await sendWelcomeCredentialsEmail({
      toEmail: email,
      name,
      tempPassword: rawTempPassword,
      role: targetRole,
      loginUrl: req.headers.origin ? `${req.headers.origin}/login` : undefined,
    });

    res.status(201).json({
      success: true,
      message: `${targetRole === 'HR' ? 'HR Officer' : 'Employee'} onboarded successfully with ID ${employee_id}. Initial temporary password (${rawTempPassword}) dispatched to ${email}.`,
      employee: newEmployee,
      temp_password: rawTempPassword,
      email_sent: emailResult.success,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee record' });
  }
});

// Update Employee Profile (including profile photo upload for all roles)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const isSelf = req.user.id === targetId;
    const isAdmin = req.user.role === 'ADMIN';
    const isHr = req.user.role === 'HR';

    if (!isSelf && !isAdmin && !isHr) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const currentTarget = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!currentTarget) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // HR cannot edit ADMIN accounts
    if (isHr && !isAdmin && currentTarget.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'HR Officers cannot modify Administrator accounts' });
    }

    // HR cannot edit employees outside their department (unless editing themselves)
    if (isHr && !isAdmin && !isSelf && req.user.department && currentTarget.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: As HR for ${req.user.department}, you can only modify employees in your department.`,
      });
    }

    const {
      name,
      email,
      phone,
      address,
      avatar,
      department,
      designation,
      status,
      role,
    } = req.body;

    let updatedName = currentTarget.name;
    let updatedEmail = currentTarget.email;
    let updatedPhone = phone !== undefined ? phone : currentTarget.phone;
    let updatedAddress = address !== undefined ? address : currentTarget.address;
    let updatedAvatar = avatar !== undefined ? avatar : currentTarget.avatar;
    let updatedDept = currentTarget.department;
    let updatedDesig = currentTarget.designation;
    let updatedStatus = currentTarget.status;
    let updatedRole = currentTarget.role;

    if (isAdmin) {
      if (name) updatedName = name;
      if (email && email.trim() !== currentTarget.email) {
        const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), targetId);
        if (existing) {
          return res.status(400).json({ success: false, message: 'This email address is already in use by another user' });
        }
        updatedEmail = email.trim();
      }
      if (department) updatedDept = department;
      if (designation) updatedDesig = designation;
      if (status) updatedStatus = status;
      if (role && ['ADMIN', 'HR', 'EMPLOYEE'].includes(role.toUpperCase())) {
        updatedRole = role.toUpperCase();
      }
    } else if (isHr && !isSelf) {
      if (name) updatedName = name;
      if (designation) updatedDesig = designation;
      if (status) updatedStatus = status;
    } else if (isSelf) {
      // Any user can update their name, phone, address, avatar
      if (name) updatedName = name;
    }

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?, address = ?, avatar = ?, department = ?, designation = ?, status = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updatedName,
      updatedEmail,
      updatedPhone,
      updatedAddress,
      updatedAvatar,
      updatedDept,
      updatedDesig,
      updatedStatus,
      updatedRole,
      targetId
    );

    const updatedUser = db.prepare('SELECT id, employee_id, name, email, role, department, designation, phone, address, avatar, status, must_change_password FROM users WHERE id = ?').get(targetId);

    res.json({ success: true, message: 'Profile updated successfully', employee: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

// Delete Employee Record
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const isAdmin = req.user.role === 'ADMIN';
    const isHr = req.user.role === 'HR';

    if (!isAdmin && !isHr) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only Administrators and HR Officers can delete employee records.' });
    }

    // Prevent deleting oneself
    if (req.user.id === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active account.' });
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    // HR restrictions
    if (isHr && !isAdmin) {
      if (targetUser.role === 'ADMIN' || targetUser.role === 'HR') {
        return res.status(403).json({ success: false, message: 'HR Officers cannot delete Administrator or HR accounts.' });
      }
      if (req.user.department && targetUser.department !== req.user.department) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: As HR for ${req.user.department}, you can only delete records in your department.`,
        });
      }
    }

    // Cascade delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

    res.json({
      success: true,
      message: `Record for ${targetUser.name} (${targetUser.employee_id}) has been permanently deleted.`,
      deletedId: targetId,
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee record' });
  }
});

// Attach Document
router.post('/:id/documents', authenticateToken, requireHrOrAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { title, type = 'General', url, file_size = '1.5 MB' } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }

    const result = db.prepare(`
      INSERT INTO documents (user_id, title, type, url, file_size)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, title, type, url, file_size);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Document attached successfully', document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to attach document' });
  }
});

module.exports = router;
