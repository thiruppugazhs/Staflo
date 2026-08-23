import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Building, Plus, Trash2, Users, CheckCircle2, AlertTriangle, Briefcase } from 'lucide-react';

export function ManageDepartmentsModal({ isOpen, onClose, onUpdated }) {
  const { showToast } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New Department Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getDepartments();
      if (res.success) {
        setDepartments(res.departments || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      setShowAddForm(false);
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      const res = await api.createDepartment({ name: name.trim(), description: description.trim() });
      if (res.success) {
        showToast(res.message || 'Department created successfully', 'success');
        setName('');
        setDescription('');
        setShowAddForm(false);
        loadDepartments();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create department', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await api.deleteDepartment(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Department removed successfully', 'success');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        loadDepartments();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Department Management"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          {/* Header Action */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <div>
              <span className="font-bold text-amber-950 block text-xs">Organizational Departments</span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Create new business units, manage department classifications, and view assigned staff counts.
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
            )}
          </div>

          {/* Add Department Inline Form */}
          {showAddForm && (
            <form onSubmit={handleCreateDepartment} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  <span>Create New Department</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Department Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence & Data"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Description / Function
                </label>
                <input
                  type="text"
                  placeholder="Brief description of department scope and objectives"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !name.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{adding ? 'Creating...' : 'Save Department'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Department List */}
          {loading ? (
            <div className="p-8 text-center text-stone-400">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
              No departments found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-300 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-xs">{dept.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        <span>{dept.employee_count || 0} Members</span>
                      </span>
                    </div>
                    {dept.description && (
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        {dept.description}
                      </p>
                    )}
                  </div>

                  {dept.employee_count === 0 ? (
                    <button
                      onClick={() => { setDeleteTarget(dept); setIsDeleteOpen(true); }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Empty Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span
                      className="text-[10px] text-stone-400 font-semibold px-2 py-1 bg-stone-50 rounded-lg"
                      title="Assigned departments cannot be deleted until staff are reassigned"
                    >
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t border-stone-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Department Confirmation Modal */}
      {isDeleteOpen && deleteTarget && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
          title="Delete Department"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Delete Department '{deleteTarget.name}'?</span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  This action will permanently remove this department from organization listings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ManageDepartmentsModal;
