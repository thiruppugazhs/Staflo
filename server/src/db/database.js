const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../hrms.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize Database Schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HR', 'EMPLOYEE')),
      department TEXT DEFAULT 'General',
      designation TEXT DEFAULT 'Staff',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      joining_date TEXT DEFAULT '',
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'PROBATION')),
      is_verified INTEGER DEFAULT 1,
      verification_token TEXT DEFAULT '',
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      basic_salary REAL NOT NULL DEFAULT 0,
      hra REAL NOT NULL DEFAULT 0,
      allowances REAL NOT NULL DEFAULT 0,
      deductions REAL NOT NULL DEFAULT 0,
      net_salary REAL NOT NULL DEFAULT 0,
      effective_date TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      duration_minutes INTEGER DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('PAID', 'SICK', 'UNPAID', 'CASUAL')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      admin_comment TEXT DEFAULT '',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payroll_slips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      basic_salary REAL NOT NULL,
      hra REAL NOT NULL,
      allowances REAL NOT NULL,
      deductions REAL NOT NULL,
      net_pay REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PAID' CHECK(status IN ('PAID', 'PENDING', 'GENERATED')),
      payment_date TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      file_size TEXT DEFAULT '1.2 MB',
      upload_date TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
      is_read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'GENERAL' CHECK(category IN ('GENERAL', 'IMPORTANT', 'POLICY', 'EVENT', 'HOLIDAY')),
      target_department TEXT DEFAULT 'ALL',
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('PAYROLL', 'LEAVE', 'BENEFITS', 'WORKPLACE', 'TECHNICAL', 'OTHER')),
      priority TEXT DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
      department TEXT NOT NULL,
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leave_type TEXT UNIQUE NOT NULL,
      annual_limit INTEGER NOT NULL,
      description TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function initDefaults() {
  try {
    // 1. Pre-seed Default Departments
    const deptCount = db.prepare('SELECT count(*) as count FROM departments').get().count;
    if (deptCount === 0) {
      const defaultDepts = [
        { name: 'Engineering', description: 'Software development, cloud infrastructure, and QA' },
        { name: 'Product & Design', description: 'UI/UX design, product strategy, and user experience' },
        { name: 'Human Resources', description: 'People operations, talent acquisition, and compliance' },
        { name: 'Finance', description: 'Accounting, corporate payroll, and fiscal planning' },
        { name: 'Marketing', description: 'Growth marketing, branding, and communications' },
        { name: 'Sales', description: 'Business development and client accounts' },
        { name: 'Executive Management', description: 'Executive leadership and company administration' },
        { name: 'General', description: 'General administration and support' },
      ];
      const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)');
      for (const d of defaultDepts) {
        insertDept.run(d.name, d.description);
      }
    }

    // 2. Pre-seed Default Leave Limits
    const limitCount = db.prepare('SELECT count(*) as count FROM leave_limits').get().count;
    if (limitCount === 0) {
      const defaultLimits = [
        { leave_type: 'PAID', annual_limit: 18, description: 'Annual Paid Vacation & Earned Leave' },
        { leave_type: 'SICK', annual_limit: 12, description: 'Medical, Health & Wellness Leave' },
        { leave_type: 'CASUAL', annual_limit: 10, description: 'Personal, Family & Casual Emergency Leave' },
        { leave_type: 'UNPAID', annual_limit: 30, description: 'Extended Unpaid Leave of Absence' },
      ];
      const insertLimit = db.prepare('INSERT OR IGNORE INTO leave_limits (leave_type, annual_limit, description) VALUES (?, ?, ?)');
      for (const l of defaultLimits) {
        insertLimit.run(l.leave_type, l.annual_limit, l.description);
      }
    }
  } catch (err) {
    console.warn('Defaults initialization warning:', err.message);
  }
}

function ensureAdminExists() {
  try {
    const bcrypt = require('bcryptjs');
    const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@dayflow.com');
    if (!admin) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('Admin@1234', salt);

      const insertUser = db.prepare(`
        INSERT INTO users (employee_id, name, email, password, role, department, designation, phone, address, status, is_verified, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertUser.run(
        'ADM-001',
        'Sarah Jenkins',
        'admin@dayflow.com',
        hashedPassword,
        'ADMIN',
        'Executive Management',
        'HR Director & System Administrator',
        '9876543210',
        '100 Innovation Way, Suite 500',
        'ACTIVE',
        1,
        0
      );

      db.prepare(`
        INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(result.lastInsertRowid, 120000, 45000, 25000, 15000, 175000, '2026-01-01');

      console.log('✅ Master Admin (admin@dayflow.com / Admin@1234) initialized successfully.');
    }
  } catch (err) {
    console.error('Admin initialization warning:', err.message);
  }
}

initSchema();
initDefaults();
ensureAdminExists();

module.exports = db;

