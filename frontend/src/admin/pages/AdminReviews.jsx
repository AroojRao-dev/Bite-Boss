import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { backendUrl } from "../../config";

const AVATAR_COLORS = [
  { bg: "#E6F1FB", tc: "#0C447C" },
  { bg: "#EAF3DE", tc: "#27500A" },
  { bg: "#FAEEDA", tc: "#633806" },
  { bg: "#FBEAF0", tc: "#72243E" },
  { bg: "#E1F5EE", tc: "#085041" },
  { bg: "#FAECE7", tc: "#993C1D" },
];

function getInitials(name = "") {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
}

const RATING_BADGE = {
  5: "bg-green-50 text-green-800",
  4: "bg-teal-50 text-teal-800",
  3: "bg-amber-50 text-amber-800",
  2: "bg-orange-50 text-orange-800",
  1: "bg-red-50 text-red-800",
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= rating ? "text-amber-500 text-sm" : "text-gray-200 text-sm"}>
        ★
      </span>
    ))}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/reviews/${deleteTarget._id}`);
      if (res.data?.success) {
        setReviews((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      }
    } catch (err) {
      console.log(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => {
    let list = reviews.filter((r) => {
      const matchQ = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.comment?.toLowerCase().includes(search.toLowerCase());
      const matchR = !ratingFilter || r.rating === Number(ratingFilter);
      return matchQ && matchR;
    });
    if (sortBy === "oldest") list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === "highest") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "lowest") list = [...list].sort((a, b) => a.rating - b.rating);
    else list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [reviews, search, ratingFilter, sortBy]);

  const stats = useMemo(() => ({
    total: reviews.length,
    avg: reviews.length
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : "—",
    fiveStar: reviews.filter((r) => r.rating === 5).length,
  }), [reviews]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Customer reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage all user feedback</p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-100 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total reviews", value: stats.total },
          { label: "Average rating", value: `${stats.avg} / 5` },
          { label: "5-star reviews", value: stats.fiveStar },
        ].map((s) => (
          <div key={s.label} className="bg-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-medium text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} stars</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500 text-sm">
          <span className="animate-spin text-lg">⟳</span> Loading reviews…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">⭐</div>
          <p className="font-medium">No reviews found</p>
          <p className="text-sm mt-1 text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const color = getAvatarColor(r.name || "");
            return (
              <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: color.bg, color: color.tc }}
                    >
                      {getInitials(r.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name || "Anonymous"}</p>
                      <p className="text-xs text-gray-400">{dayjs(r.createdAt).format("DD MMM YYYY")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Delete review"
                  >
                    🗑
                  </button>
                </div>

                {/* Stars */}
                <StarRating rating={r.rating || 0} />

                {/* Comment */}
                <p className="text-sm text-gray-600 mt-2 mb-3 leading-relaxed">
                  {r.comment || "No comment provided."}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RATING_BADGE[r.rating] || "bg-gray-100 text-gray-600"}`}>
                    {r.rating} / 5
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-80">
            <h3 className="text-base font-medium text-gray-900 mb-2">Delete review?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Delete review by{" "}
              <span className="font-medium text-gray-800">"{deleteTarget.name}"</span>? This cannot be undone.
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

export default AdminReviews;