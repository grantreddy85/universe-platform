import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProviderHeader({ user }) {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Welcome back, {user?.full_name || user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}