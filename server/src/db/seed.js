const db = require('./database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  console.log('🌱 Initializing Fresh Daily Flow HRMS Database...');

  db.exec(`
    DROP TABLE IF EXISTS otp_verifications;
    DROP TABLE IF EXISTS ticket_messages;
    DROP TABLE IF EXISTS support_tickets;
    DROP TABLE IF EXISTS announcements;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS documents;
    DROP TABLE IF EXISTS payroll_slips;
    DROP TABLE IF EXISTS leaves;
    DROP TABLE IF EXISTS attendance;
    DROP TABLE IF EXISTS salary_structures;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
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

    CREATE TABLE salary_structures (
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

    CREATE TABLE attendance (
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

    CREATE TABLE leaves (
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

    CREATE TABLE payroll_slips (
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

    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      file_size TEXT DEFAULT '1.2 MB',
      upload_date TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE notifications (
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

    CREATE TABLE announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'GENERAL' CHECK(category IN ('GENERAL', 'IMPORTANT', 'POLICY', 'EVENT', 'HOLIDAY')),
      target_department TEXT DEFAULT 'ALL',
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE support_tickets (
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

    CREATE TABLE ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@1234', salt);

  // ONLY Single Seeded Admin Account (No default profile picture)
  const insertUser = db.prepare(`
    INSERT INTO users (employee_id, name, email, password, role, department, designation, phone, address, avatar, joining_date, status, is_verified, must_change_password)
    VALUES (@employee_id, @name, @email, @password, @role, @department, @designation, @phone, @address, @avatar, @joining_date, @status, @is_verified, @must_change_password)
  `);

  const adminResult = insertUser.run({
    employee_id: 'ADM-001',
    name: 'Sarah Jenkins',
    email: 'admin@dayflow.com',
    password: adminHash,
    role: 'ADMIN',
    department: 'Executive Management',
    designation: 'System Administrator & HR Director',
    phone: '9876543210',
    address: '742 Evergreen Terrace, Springfield, OR',
    avatar: '', // No default profile picture
    joining_date: '2022-01-15',
    status: 'ACTIVE',
    is_verified: 1,
    must_change_password: 0,
  });

  const adminId = adminResult.lastInsertRowid;

  // Initial Admin Salary Structure
  db.prepare(`
    INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
    VALUES (?, 8500, 2500, 1500, 1200, 11300, CURRENT_DATE)
  `).run(adminId);

  // Default Welcome Announcement
  db.prepare(`
    INSERT INTO announcements (title, content, category, target_department, author_id)
    VALUES ('Welcome to Daily Flow', 'Welcome to the Daily Flow workspace. Mobile numbers are set as default temporary passwords upon onboarding. Users can upload their own profile pictures in the profile tab.', 'IMPORTANT', 'ALL', ?)
  `).run(adminId);

  console.log('✅ Daily Flow HRMS database initialized with single master Admin account (admin@dayflow.com)!');
}

seedDatabase();
module.exports = seedDatabase;
