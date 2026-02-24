import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, User, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminModeToggle() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (user?.role !== "admin") return null;

  const isAdminPage = window.location.pathname.includes("AdminDashboard");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
          isAdminPage
            ? "bg-[#000021] text-[#00F2FF] border-[#00F2FF]/30"
            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
        }`}
      >
        {isAdminPage ? (
          <Shield className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
        <span>{isAdminPage ? "Admin Mode" : "User Mode"}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => { navigate(createPageUrl("Home")); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${!isAdminPage ? "text-[#000021] font-semibold bg-gray-50" : "text-gray-600"}`}
            >
              <User className="w-4 h-4" />
              User Mode
              {!isAdminPage && <span className="ml-auto text-[10px] text-green-500 font-bold">ACTIVE</span>}
            </button>
            <button
              onClick={() => { navigate(createPageUrl("AdminDashboard")); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${isAdminPage ? "text-[#000021] font-semibold bg-gray-50" : "text-gray-600"}`}
            >
              <Shield className="w-4 h-4" />
              Admin Mode
              {isAdminPage && <span className="ml-auto text-[10px] text-[#00F2FF] font-bold">ACTIVE</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}