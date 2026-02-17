import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  Home,
  FolderKanban,
  Briefcase,
  FlaskConical,
  Coins,
  Store,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search
} from "lucide-react";
import UniVerseLogo from "@/components/UniVerseLogo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { name: "Research", icon: Search, page: "Search" },
  { name: "Home", icon: Home, page: "Home" },
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Workspace", icon: Briefcase, page: "Workspace" },
  { name: "Labs", icon: FlaskConical, page: null, external: true },
  { name: "Tokenisation", icon: Coins, page: "Tokenisation" },
  { name: "Marketplace", icon: Store, page: null, external: true },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-[#fafbfc]">
        {/* Sidebar */}
        <aside
          className={`relative flex flex-col border-r border-gray-200/80 bg-white transition-all duration-300 ease-in-out ${
            collapsed ? "w-[68px]" : "w-[220px]"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
            <UniVerseLogo className="w-8 h-8 flex-shrink-0" />
            {!collapsed && (
              <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                UniVerse
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;

              if (item.external) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-default opacity-40 ${
                          collapsed ? "justify-center" : ""
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
                        {!collapsed && <span>{item.name}</span>}
                      </div>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="text-xs">
                        {item.name} (Coming Soon)
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              }

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => {
                        if (item.name === "Research") {
                          localStorage.setItem("search_reset_trigger", Date.now().toString());
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                        collapsed ? "justify-center" : ""
                      } ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 ${
                          isActive ? "text-blue-600" : ""
                        }`}
                        strokeWidth={1.7}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="text-xs">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-gray-100 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={createPageUrl("Profile")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.8} />
                  </div>
                  {!collapsed && (
                    <span className="truncate text-xs">
                      {user?.full_name || user?.email || "Profile"}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="text-xs">
                  Profile
                </TooltipContent>
              )}
            </Tooltip>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all w-full mt-1"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
                Sign out
              </button>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </TooltipProvider>
  );
}