import React, { useState } from "react";
import { Search, Users, Crown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function UserDirectoryPanel({ users, selectedUser, onSelectUser }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-semibold text-gray-700">Platform Users</p>
          <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{users.length}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-8 h-8 text-xs bg-gray-50 border-gray-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.map(u => (
          <button
            key={u.id}
            onClick={() => onSelectUser(u)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
              selectedUser?.id === u.id ? "bg-[#000021]/5 border-l-2 border-[#000021]" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {u.role === "admin"
                ? <Crown className="w-3.5 h-3.5 text-amber-500" />
                : <User className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{u.full_name || "Unnamed"}</p>
              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
              u.role === "admin" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
            }`}>
              {u.role || "user"}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-10">No users found</p>
        )}
      </div>
    </div>
  );
}