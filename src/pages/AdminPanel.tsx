import React, { useEffect, useState, useCallback, useMemo } from "react";
import { UserRole } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import toast from "react-hot-toast";
import { Users, UserPlus, Shield, RefreshCw, Search, Filter, CreditCard as Edit2, Trash2, Building2, X, Check, TriangleAlert as AlertTriangle, Key, Clock, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  officeLocation: string;
  createdAt: string;
  lastActive: string;
  status: "active" | "inactive" | "suspended";
}

const ROLE_LABELS: Record<UserRole, { label: string; color: string; description: string }> = {
  Trainer: { label: "Trainer", color: "bg-blue-100 text-blue-700", description: "Submit and manage own cases" },
  Supervisor: { label: "Supervisor", color: "bg-indigo-100 text-indigo-700", description: "View cases for assigned LOBs" },
  Manager: { label: "Manager", color: "bg-purple-100 text-purple-700", description: "View cases for assigned accounts" },
  SrManager: { label: "Sr. Manager", color: "bg-pink-100 text-pink-700", description: "Full visibility across all cases" },
  PS: { label: "People Solutions", color: "bg-teal-100 text-teal-700", description: "Manage cases, approve terminations" },
  TA: { label: "Talent Acquisition", color: "bg-amber-100 text-amber-700", description: "Manage relocations and clearance" },
  Admin: { label: "Administrator", color: "bg-red-100 text-red-700", description: "Full system administration" },
};

const AVAILABLE_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");

  // Modal states
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);

  // Mock data - in production this would come from an API
  const mockUsers: AdminUser[] = useMemo(() => [
    {
      id: "1",
      email: "john.trainer@concentrix.com",
      displayName: "John Trainer",
      role: "Trainer",
      department: "Training Operations",
      officeLocation: "Manila",
      createdAt: "2025-01-15T08:00:00Z",
      lastActive: "2026-06-26T10:30:00Z",
      status: "active",
    },
    {
      id: "2",
      email: "jane.supervisor@concentrix.com",
      displayName: "Jane Supervisor",
      role: "Supervisor",
      department: "Training Operations",
      officeLocation: "Cebu",
      createdAt: "2025-02-20T09:00:00Z",
      lastActive: "2026-06-25T15:00:00Z",
      status: "active",
    },
    {
      id: "3",
      email: "mike.manager@concentrix.com",
      displayName: "Mike Manager",
      role: "Manager",
      department: "Operations",
      officeLocation: "Manila",
      createdAt: "2025-01-10T10:00:00Z",
      lastActive: "2026-06-26T09:00:00Z",
      status: "active",
    },
    {
      id: "4",
      email: "sarah.ps@concentrix.com",
      displayName: "Sarah PS Lead",
      role: "PS",
      department: "People Solutions",
      officeLocation: "Manila",
      createdAt: "2024-11-05T08:00:00Z",
      lastActive: "2026-06-26T12:00:00Z",
      status: "active",
    },
    {
      id: "5",
      email: "tom.ta@concentrix.com",
      displayName: "Tom TA Specialist",
      role: "TA",
      department: "Talent Acquisition",
      officeLocation: "Manila",
      createdAt: "2025-03-01T09:00:00Z",
      lastActive: "2026-06-26T11:00:00Z",
      status: "active",
    },
    {
      id: "6",
      email: "admin@concentrix.com",
      displayName: "System Admin",
      role: "Admin",
      department: "IT",
      officeLocation: "Global",
      createdAt: "2024-01-01T00:00:00Z",
      lastActive: "2026-06-26T14:00:00Z",
      status: "active",
    },
    {
      id: "7",
      email: "inactive.user@concentrix.com",
      displayName: "Inactive User",
      role: "Trainer",
      department: "Training Operations",
      officeLocation: "Davao",
      createdAt: "2025-04-10T08:00:00Z",
      lastActive: "2026-01-15T10:00:00Z",
      status: "inactive",
    },
  ], []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would be an API call
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [mockUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterStatus !== "all" && u.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, filterRole, filterStatus, search]);

  // User stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    byRole: AVAILABLE_ROLES.reduce((acc, role) => {
      acc[role] = users.filter(u => u.role === role).length;
      return acc;
    }, {} as Record<UserRole, number>),
  }), [users]);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // In production, this would be an API call
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${ROLE_LABELS[newRole].label}`);
      setEditUser(null);
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: "active" | "inactive" | "suspended") => {
    try {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`User status changed to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Handle delete
  const handleDeleteUser = async (userId: string) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success("User deleted successfully");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  // Handle add user
  const handleAddUser = async (userData: { email: string; displayName: string; role: UserRole }) => {
    try {
      const newUser: AdminUser = {
        id: String(Date.now()),
        ...userData,
        department: "New User",
        officeLocation: "TBD",
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: "active",
      };
      setUsers(prev => [...prev, newUser]);
      toast.success("User added successfully");
      setShowAddModal(false);
    } catch (err) {
      toast.error("Failed to add user");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading admin panel..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-teal-300">Administration</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold tracking-wide">
            USER & ROLE MANAGEMENT
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tooltip content="Add new user" position="bottom">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </Tooltip>
          <Tooltip content="Refresh data" position="bottom">
            <button
              onClick={loadUsers}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </Tooltip>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={stats.total} icon={<Users className="w-4 h-4" />} color="teal" />
        <StatCard label="Active" value={stats.active} icon={<Activity className="w-4 h-4" />} color="green" />
        <StatCard label="Trainers" value={stats.byRole.Trainer} icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="PS Staff" value={stats.byRole.PS} icon={<Shield className="w-4 h-4" />} color="teal" />
        <StatCard label="TA Staff" value={stats.byRole.TA} icon={<Users className="w-4 h-4" />} color="amber" />
        <StatCard label="Admins" value={stats.byRole.Admin} icon={<Key className="w-4 h-4" />} color="red" />
      </div>

      {/* Filters */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as UserRole | "all")}
          >
            <option value="all">All Roles</option>
            {AVAILABLE_ROLES.map(role => (
              <option key={role} value={role}>{ROLE_LABELS[role].label}</option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <span className="text-xs text-gray-400 ml-auto font-mono">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No users match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Active</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u, idx) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-teal-50/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {u.displayName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.displayName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_LABELS[u.role].color}`}>
                        {ROLE_LABELS[u.role].label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-600">{u.department}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{u.officeLocation}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{new Date(u.lastActive).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Tooltip content="Edit user" position="top">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-teal-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        {u.status === "active" ? (
                          <Tooltip content="Suspend user" position="top">
                            <button
                              onClick={() => handleStatusChange(u.id, "suspended")}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Activate user" position="top">
                            <button
                              onClick={() => handleStatusChange(u.id, "active")}
                              className="p-2 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip content="Delete user" position="top">
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleRoleChange}
          />
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddUser}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            user={deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeleteUser(deleteConfirm.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: "from-teal-50 to-teal-100/50 border-teal-200/50",
    green: "from-green-50 to-green-100/50 border-green-200/50",
    blue: "from-blue-50 to-blue-100/50 border-blue-200/50",
    amber: "from-amber-50 to-amber-100/50 border-amber-200/50",
    red: "from-red-50 to-red-100/50 border-red-200/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500">{icon}</span>
      </div>
      <div className="text-2xl font-barlow-condensed font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </motion.div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: "active" | "inactive" | "suspended" }) {
  const config = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
    inactive: { bg: "bg-gray-100", text: "text-gray-700", label: "Inactive" },
    suspended: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${c.bg} ${c.text}`}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
      {c.label}
    </span>
  );
}

// Edit User Modal
function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (id: string, role: UserRole) => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-barlow-condensed text-lg font-bold text-gray-900">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              {user.displayName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {AVAILABLE_ROLES.map(role => (
                <option key={role} value={role}>{ROLE_LABELS[role].label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{ROLE_LABELS[selectedRole].description}</p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => onSave(user.id, selectedRole)} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">Save Changes</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Add User Modal
function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: { email: string; displayName: string; role: UserRole }) => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("Trainer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!email.endsWith("@concentrix.com")) {
      toast.error("Email must be a Concentrix email");
      return;
    }
    onAdd({ email, displayName, role });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-barlow-condensed text-lg font-bold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="John Doe"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@concentrix.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {AVAILABLE_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gradient-teal hover:opacity-90 rounded-lg transition-all shadow-glow-teal">Add User</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ user, onClose, onConfirm }: { user: AdminUser; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="font-barlow-condensed text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <span className="font-medium text-gray-700">{user.displayName}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
