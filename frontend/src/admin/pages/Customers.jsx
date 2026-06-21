import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../../config";

const AVATAR_COLORS = [
  { bg: "#FAEEDA", tc: "#633806" },
  { bg: "#EAF3DE", tc: "#27500A" },
  { bg: "#E6F1FB", tc: "#0C447C" },
  { bg: "#FBEAF0", tc: "#72243E" },
  { bg: "#E1F5EE", tc: "#085041" },
  { bg: "#FAECE7", tc: "#993C1D" },
];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
}

const ITEMS_PER_PAGE = 8;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, name }

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      if (!token) { toast.error("Admin token missing. Please login again."); return; }
      const res = await axios.get(`${backendUrl}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API response:", res.data); 
      setCustomers(res.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ✅ DELETE FUNCTION
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${backendUrl}/api/user/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toast.success(`${deleteTarget.name} deleted successfully`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((u) => {
      const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchR = !roleFilter || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [customers, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: customers.length,
    admins: customers.filter((u) => u.role === "admin").length,
    users: customers.filter((u) => u.role !== "admin").length,
  }), [customers]);

  return (

    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and view all registered users</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-100 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Customers", value: stats.total, sub: "All time" },
          { label: "Admins", value: stats.admins, sub: "With admin access" },
          { label: "Regular Users", value: stats.users, sub: "Standard accounts" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-medium text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-gray-500 text-sm">
            <span className="animate-spin text-lg">⟳</span> Loading customers…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1 text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => {
                  const color = getAvatarColor(user.name || "");
                  return (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                            style={{ background: color.bg, color: color.tc }}
                          >
                            {getInitials(user.name)}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.role === "admin"
                            ? "bg-blue-50 text-blue-800"
                            : "bg-green-50 text-green-800"
                        }`}>
                          {user.role === "admin" ? "🛡 Admin" : "👤 User"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-PK", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "N/A"}
                      </td>

                      {/* ✅ DELETE BUTTON */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteTarget({ _id: user._id, name: user.name })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                          title="Delete customer"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination — auto increases with data */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-md text-xs border transition-colors ${
                      p === page
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ✅ DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-80 shadow-lg">
            <h3 className="text-base font-medium text-gray-900 mb-2">Delete customer?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete <span className="font-medium text-gray-800">"{deleteTarget.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-sm px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;