import React from "react";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children, handleLogout }) => {
  return (
    <div className="flex min-h-screen bg-[#0b0b0d]">

      {/* Sidebar fixed hai — yeh div uski jagah reserve karta hai */}
      <div className="w-60 shrink-0" />

      {/* Baaki poori width main content ke liye */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-gray-50">
        {children}
      </main>

    </div>
  );
};

export default AdminLayout;