const { supabase } = require('./supabase');
const db = require('./database');

const TABLES = [
  'departments',
  'leave_limits',
  'users',
  'salary_structures',
  'attendance',
  'leaves',
  'payroll_slips',
  'announcements',
  'support_tickets',
  'ticket_messages',
  'documents',
  'notifications',
  'otp_verifications',
];

/**
 * Pull all data from Supabase Cloud into local SQLite on startup
 */
async function pullFromSupabase() {
  if (!supabase) {
    console.warn('⚠️ Supabase client not configured. Skipping cloud pull.');
    return;
  }

  console.log('🔄 Checking and syncing data from Supabase Cloud...');

  try {
    // 1. Check if Supabase has users
    const { data: cloudUsers, error: userErr } = await supabase.from('users').select('*');
    if (userErr) {
      console.warn('⚠️ Supabase pull error for users:', userErr.message);
      return;
    }

    if (!cloudUsers || cloudUsers.length === 0) {
      console.log('ℹ️ Supabase Cloud is empty. Pushing initial local state to Supabase...');
      await pushAllToSupabase();
      return;
    }

    // 2. Restore Departments
    const { data: depts } = await supabase.from('departments').select('*');
    if (depts && depts.length > 0) {
      const insertDept = db.prepare('INSERT OR REPLACE INTO departments (id, name, description, created_at) VALUES (?, ?, ?, ?)');
      const tx = db.transaction((items) => {
        for (const d of items) {
          insertDept.run(d.id, d.name, d.description || '', d.created_at || new Date().toISOString());
        }
      });
      tx(depts);
    }

    // 3. Restore Leave Limits
    const { data: limits } = await supabase.from('leave_limits').select('*');
    if (limits && limits.length > 0) {
      const insertLimit = db.prepare('INSERT OR REPLACE INTO leave_limits (id, leave_type, annual_limit, description, updated_at) VALUES (?, ?, ?, ?, ?)');
      const tx = db.transaction((items) => {
        for (const l of items) {
          insertLimit.run(l.id, l.leave_type, l.annual_limit, l.description || '', l.updated_at || new Date().toISOString());
        }
      });
      tx(limits);
    }

    // 4. Restore Users
    if (cloudUsers.length > 0) {
      const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (id, employee_id, name, email, password, role, department, designation, phone, address, avatar, joining_date, status, is_verified, verification_token, must_change_password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const u of items) {
          insertUser.run(
            u.id,
            u.employee_id,
            u.name,
            u.email,
            u.password,
            u.role,
            u.department || 'General',
            u.designation || 'Staff',
            u.phone || '',
            u.address || '',
            u.avatar || '',
            u.joining_date || '',
            u.status || 'ACTIVE',
            u.is_verified ?? 1,
            u.verification_token || '',
            u.must_change_password ?? 0,
            u.created_at || new Date().toISOString(),
            u.updated_at || new Date().toISOString()
          );
        }
      });
      tx(cloudUsers);
    }

    // 5. Restore Salary Structures
    const { data: salaries } = await supabase.from('salary_structures').select('*');
    if (salaries && salaries.length > 0) {
      const insertSal = db.prepare(`
        INSERT OR REPLACE INTO salary_structures (id, user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const s of items) {
          insertSal.run(s.id, s.user_id, s.basic_salary, s.hra, s.allowances, s.deductions, s.net_salary, s.effective_date || '', s.updated_at || new Date().toISOString());
        }
      });
      tx(salaries);
    }

    // 6. Restore Attendance
    const { data: att } = await supabase.from('attendance').select('*');
    if (att && att.length > 0) {
      const insertAtt = db.prepare(`
        INSERT OR REPLACE INTO attendance (id, user_id, date, check_in, check_out, duration_minutes, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const a of items) {
          insertAtt.run(a.id, a.user_id, a.date, a.check_in || null, a.check_out || null, a.duration_minutes || 0, a.status, a.notes || '', a.created_at || new Date().toISOString());
        }
      });
      tx(att);
    }

    // 7. Restore Leaves
    const { data: leaves } = await supabase.from('leaves').select('*');
    if (leaves && leaves.length > 0) {
      const insertLeave = db.prepare(`
        INSERT OR REPLACE INTO leaves (id, user_id, leave_type, start_date, end_date, total_days, reason, status, admin_comment, reviewed_by, reviewed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const l of items) {
          insertLeave.run(l.id, l.user_id, l.leave_type, l.start_date, l.end_date, l.total_days, l.reason, l.status, l.admin_comment || '', l.reviewed_by || null, l.reviewed_at || null, l.created_at || new Date().toISOString());
        }
      });
      tx(leaves);
    }

    // 8. Restore Payroll Slips
    const { data: slips } = await supabase.from('payroll_slips').select('*');
    if (slips && slips.length > 0) {
      const insertSlip = db.prepare(`
        INSERT OR REPLACE INTO payroll_slips (id, user_id, month, year, basic_salary, hra, allowances, deductions, net_pay, status, payment_date, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const p of items) {
          insertSlip.run(p.id, p.user_id, p.month, p.year, p.basic_salary, p.hra, p.allowances, p.deductions, p.net_pay, p.status, p.payment_date || null, p.generated_at || new Date().toISOString());
        }
      });
      tx(slips);
    }

    // 9. Restore Announcements
    const { data: announcements } = await supabase.from('announcements').select('*');
    if (announcements && announcements.length > 0) {
      const insertAnn = db.prepare(`
        INSERT OR REPLACE INTO announcements (id, title, content, category, target_department, author_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const an of items) {
          insertAnn.run(an.id, an.title, an.content, an.category, an.target_department || 'ALL', an.author_id, an.created_at || new Date().toISOString());
        }
      });
      tx(announcements);
    }

    // 10. Restore Support Tickets & Messages
    const { data: tickets } = await supabase.from('support_tickets').select('*');
    if (tickets && tickets.length > 0) {
      const insertTick = db.prepare(`
        INSERT OR REPLACE INTO support_tickets (id, user_id, subject, category, priority, status, department, assigned_to, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const t of items) {
          insertTick.run(t.id, t.user_id, t.subject, t.category, t.priority, t.status, t.department, t.assigned_to || null, t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString());
        }
      });
      tx(tickets);
    }

    const { data: msgs } = await supabase.from('ticket_messages').select('*');
    if (msgs && msgs.length > 0) {
      const insertMsg = db.prepare(`
        INSERT OR REPLACE INTO ticket_messages (id, ticket_id, sender_id, message, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const tx = db.transaction((items) => {
        for (const m of items) {
          insertMsg.run(m.id, m.ticket_id, m.sender_id, m.message, m.created_at || new Date().toISOString());
        }
      });
      tx(msgs);
    }

    console.log(`✅ Cloud Persistence Active: Restored ${cloudUsers.length} users, ${depts?.length || 0} departments, and all records from Supabase Cloud!`);
  } catch (err) {
    console.error('❌ Cloud pull failed:', err.message);
  }
}

/**
 * Push an individual table's full state or single record to Supabase Cloud
 */
async function pushTableToSupabase(tableName) {
  if (!supabase) return;
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) return;

    const { error } = await supabase.from(tableName).upsert(rows);
    if (error) {
      console.warn(`⚠️ Supabase push warning for ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`⚠️ Supabase push exception for ${tableName}:`, err.message);
  }
}

/**
 * Push a single record to Supabase Cloud
 */
async function pushRecordToSupabase(tableName, record) {
  if (!supabase || !record) return;
  try {
    const { error } = await supabase.from(tableName).upsert(record);
    if (error) {
      console.warn(`⚠️ Supabase record upsert error (${tableName}):`, error.message);
    }
  } catch (err) {
    console.warn(`⚠️ Supabase record upsert exception (${tableName}):`, err.message);
  }
}

/**
 * Delete a record from Supabase Cloud
 */
async function deleteRecordFromSupabase(tableName, id) {
  if (!supabase || !id) return;
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.warn(`⚠️ Supabase delete error (${tableName}, id=${id}):`, error.message);
    }
  } catch (err) {
    console.warn(`⚠️ Supabase delete exception (${tableName}, id=${id}):`, err.message);
  }
}

/**
 * Push all local tables to Supabase Cloud
 */
async function pushAllToSupabase() {
  if (!supabase) return;
  for (const table of TABLES) {
    await pushTableToSupabase(table);
  }
  console.log('✅ All local tables synchronized to Supabase Cloud.');
}

/**
 * Start periodic background sync daemon (every 45 seconds)
 */
let syncInterval = null;
function startPeriodicSync() {
  if (syncInterval) return;
  // Pull immediately on startup
  pullFromSupabase().then(() => {
    // Then schedule periodic backup push
    syncInterval = setInterval(() => {
      pushAllToSupabase().catch(() => {});
    }, 45000);
  });
}

module.exports = {
  pullFromSupabase,
  pushTableToSupabase,
  pushRecordToSupabase,
  deleteRecordFromSupabase,
  pushAllToSupabase,
  startPeriodicSync,
};
