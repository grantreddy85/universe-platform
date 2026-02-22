import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  Home,
  FolderKanban,
  Briefcase,
  FlaskConical,
  GitBranch,
  Store,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Search,
  MessageSquare
} from "lucide-react";
import UniVerseLogo from "@/components/UniVerseLogo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const navItems = [
  { name: "Research", icon: Search, page: "Search" },
  { name: "Home", icon: Home, page: "Home" },
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Workspace", icon: Briefcase, page: "Workspace" },
  { name: "Workflows", icon: GitBranch, page: null, external: true },
  { name: "Labs", icon: FlaskConical, page: "Labs" },
  { name: "Marketplace", icon: Store, page: null, external: true },
];

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    return saved ? JSON.parse(saved) : {
      fontFamily: 'Funnel Sans',
      primaryColor: '#1a1a1a',
      secondaryColor: '#ff6b35',
      accentColor: '#00d4aa',
      neutralColor: '#f8f9fa',
      fontScale: 1.0,
      themeMode: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('app_theme', JSON.stringify(theme));
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--neutral', theme.neutralColor);
    root.style.setProperty('--font-scale', theme.fontScale);
    
    // Apply to body immediately
    document.body.style.fontFamily = `'${theme.fontFamily}', sans-serif`;
    document.body.style.fontSize = `${theme.fontScale}rem`;
  }, [theme]);

  const updateTheme = (updates) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [showChatDropdown, setShowChatDropdown] = useState(true);
  const [activeChats, setActiveChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load active chats from localStorage whenever Research is active
  useEffect(() => {
    const loadChats = () => {
      const saved = localStorage.getItem("search_drafts");
      if (saved) {
        try { setActiveChats(JSON.parse(saved)); } catch { setActiveChats([]); }
      } else {
        setActiveChats([]);
      }
    };
    loadChats();
    window.addEventListener("storage", loadChats);
    window.addEventListener("search_drafts_updated", loadChats);
    return () => {
      window.removeEventListener("storage", loadChats);
      window.removeEventListener("search_drafts_updated", loadChats);
    };
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <ThemeProvider>
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
            <UniVerseLogo className="w-8 h-8 flex-shrink-0" allowUpload={true} />
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

              // Research tab with dropdown
              if (item.name === "Research") {
                const hasChats = activeChats.length > 0;
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                            collapsed ? "justify-center" : ""
                          } ${
                            isActive
                              ? "bg-blue-50/80 text-blue-600 font-medium"
                              : "text-gray-600 hover:bg-[#000021] hover:text-[#00F2FF]"
                          }`}
                        >
                          {/* Main click area → go to landing */}
                          <div
                            className="flex items-center gap-3 flex-1"
                            onClick={() => {
                              navigate(createPageUrl(item.page));
                              window.dispatchEvent(new CustomEvent("research_reset"));
                              setShowChatDropdown(false);
                            }}
                          >
                            <Icon
                              className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-blue-600" : ""}`}
                              strokeWidth={1.7}
                            />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {/* Chevron to open dropdown — only when there are active chats */}
                          {!collapsed && hasChats && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowChatDropdown((v) => !v);
                              }}
                              className="ml-auto p-0.5 rounded hover:bg-blue-100 transition-colors"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChatDropdown ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>

                        {/* Dropdown list of active chats */}
                        {!collapsed && showChatDropdown && hasChats && (
                          <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-3">
                            {activeChats.map((chat) => (
                              <button
                                key={chat.id}
                                onClick={() => {
                                  navigate(createPageUrl(item.page));
                                  window.dispatchEvent(new CustomEvent("research_switch_chat", { detail: { chatId: chat.id } }));
                                  setShowChatDropdown(false);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-[#000021] hover:text-[#00F2FF] transition-colors text-left truncate"
                              >
                                <MessageSquare className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                <span className="truncate">{chat.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="text-xs">
                        {item.name}
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                        collapsed ? "justify-center" : ""
                      } ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-[#000021] hover:text-[#00F2FF]"
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-[#000021] hover:text-[#00F2FF] transition-all ${
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
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
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
    </ThemeProvider>
  );
}