const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetOtpEmail } = require('../services/emailService');

// Register
router.post('/register', (req, res) => {
  try {
    const { employee_id, name, email, password, phone = '', role = 'EMPLOYEE', department = 'General', designation = 'Associate' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let empId = employee_id;
    if (!empId) {
      const lastUser = db.prepare('SELECT id FROM users ORDER BY id DESC LIMIT 1').get();
      const nextId = (lastUser ? lastUser.id : 0) + 1;
      empId = `EMP-${String(nextId).padStart(3, '0')}`;
    } else {
      const existingEmpId = db.prepare('SELECT id FROM users WHERE employee_id = ?').get(empId);
      if (existingEmpId) {
        return res.status(400).json({ success: false, message: 'Employee ID is already in use' });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

    const insert = db.prepare(`
      INSERT INTO users (employee_id, name, email, password, phone, role, department, designation, is_verified, verification_token, joining_date, avatar, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_DATE, '', 0)
    `);

    const result = insert.run(empId, name, email, hashedPassword, phone, userRole, department, designation, verificationToken);
    const userId = result.lastInsertRowid;

    // Create default salary structure
    const defaultBasic = userRole === 'ADMIN' ? 7000 : 5000;
    const defaultHra = userRole === 'ADMIN' ? 2000 : 1500;
    const defaultAllowances = 1000;
    const defaultDeductions = 800;
    const net = defaultBasic + defaultHra + defaultAllowances - defaultDeductions;

    db.prepare(`
      INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)
    `).run(userId, defaultBasic, defaultHra, defaultAllowances, defaultDeductions, net);

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Welcome to Daily Flow', 'Your account has been set up successfully. Explore your dashboard to track attendance and leaves.', 'SUCCESS', '/dashboard')
    `).run(userId);

    const token = jwt.sign({ id: userId, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = db.prepare('SELECT id, employee_id, name, email, role, department, designation, phone, address, avatar, joining_date, status, is_verified, must_change_password FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in', unverified: true });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      joining_date: user.joining_date,
      status: user.status,
      is_verified: user.is_verified,
      must_change_password: user.must_change_password === 1,
    };

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Change Password (Authenticated / First Login)
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: user.must_change_password
            ? 'Current password (your temporary mobile number) is incorrect.'
            : 'Current password is incorrect.',
        });
      }
    }

    if (currentPassword && currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to your temporary password.',
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, req.user.id);

    // Send confirmation notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Password Updated', 'Your account password was successfully updated.', 'SUCCESS', '/dashboard')
    `).run(req.user.id);

    res.json({
      success: true,
      message: 'Password updated successfully! You can now access your workspace.',
      user: {
        ...user,
        must_change_password: false,
      },
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = db.prepare('SELECT id, name, email, phone FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate old OTPs
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE email = ?').run(email);

    // Insert new OTP
    db.prepare(`
      INSERT INTO otp_verifications (email, otp_code, expires_at, is_used)
      VALUES (?, ?, ?, 0)
    `).run(email, otpCode, expiresAt);

    // Dispatch OTP email
    sendPasswordResetOtpEmail({ toEmail: email, otpCode }).catch(err => console.error('OTP email error:', err));

    res.json({
      success: true,
      message: `A 6-digit verification OTP has been sent to ${email}`,
      demo_otp: otpCode, // For convenient testing/demo display
      phone_preview: user.phone ? `***-***-${user.phone.slice(-4)}` : null,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate password reset' });
  }
});

// Verify OTP & Reset Password
router.post('/reset-password-otp', (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const record = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE email = ? AND otp_code = ? AND is_used = 0
      ORDER BY id DESC LIMIT 1
    `).get(email, otp.toString().trim());

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    const now = new Date().toISOString();
    if (record.expires_at < now) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    // Mark OTP as used
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(record.id);

    // Update user password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE email = ?').run(hashedPassword, email);

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (user) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Password Reset Successful', 'Your account password has been reset using OTP verification.', 'SUCCESS', '/login')
      `).run(user.id);
    }

    res.json({ success: true, message: 'Password reset successfully! You can now sign in with your new password.' });
  } catch (error) {
    console.error('Reset password OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, employee_id, name, email, role, department, designation, phone, address, avatar, joining_date, status, is_verified, must_change_password FROM users WHERE id = ?').get(req.user.id);
  const salary = db.prepare('SELECT * FROM salary_structures WHERE user_id = ?').get(req.user.id);

  res.json({
    success: true,
    user: {
      ...user,
      must_change_password: user.must_change_password === 1,
    },
    salary: salary || null,
  });
});

module.exports = router;
