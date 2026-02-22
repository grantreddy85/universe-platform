import React from "react";
import {
  Sparkles,
  Archive,
  FlaskConical,
  GitBranch,
  Shield,
  Box,
  StickyNote,
  LayoutDashboard,
  TestTube,
  ChevronLeft
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "vault", label: "Vault", icon: Archive },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "cohorts", label: "Cohorts", icon: FlaskConical },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "labs", label: "Labs", icon: TestTube },
  { id: "validation", label: "Validation", icon: Shield },
  { id: "assets", label: "Assets", icon: Box },
];

export default function ProjectTabs({ activeTab, onTabChange, tabCounts = {} }) {
  return (
    <div className="border-b border-gray-100 bg-white px-6 lg:px-10">
      <nav className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {tab.label}
              {count != null && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}