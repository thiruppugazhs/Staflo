const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { pushTableToSupabase, deleteRecordFromSupabase } = require('../db/syncEngine');

// Get all departments (with employee counts)
router.get('/', authenticateToken, (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT d.id, d.name, d.description, d.created_at,
             COUNT(u.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON LOWER(d.name) = LOWER(u.department)
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    res.json({ success: true, departments });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// Create new department (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const trimmedName = name.trim();

    const existing = db.prepare('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (existing) {
      return res.status(400).json({ success: false, message: `Department '${trimmedName}' already exists` });
    }

    const result = db.prepare(`
      INSERT INTO departments (name, description)
      VALUES (?, ?)
    `).run(trimmedName, description.trim());

    const newDept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);

    // Push to Supabase Cloud
    pushTableToSupabase('departments');

    res.status(201).json({
      success: true,
      message: `Department '${trimmedName}' created successfully`,
      department: { ...newDept, employee_count: 0 },
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
});

// Delete department (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const deptId = parseInt(req.params.id, 10);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(deptId);

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if any employees belong to this department
    const assignedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE LOWER(department) = LOWER(?)').get(dept.name).count;
    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete '${dept.name}' because ${assignedCount} employee(s) are currently assigned to it. Please reassign those members before deleting.`,
      });
    }

    db.prepare('DELETE FROM departments WHERE id = ?').run(deptId);

    // Remove from Supabase Cloud
    deleteRecordFromSupabase('departments', deptId);

    res.json({
      success: true,
      message: `Department '${dept.name}' removed successfully`,
      deletedId: deptId,
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

module.exports = router;
