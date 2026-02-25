import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StatsCard({ label, value, icon: Icon, accent = "blue", linkTo, iconColor: initialIconColor = "#00f2ff" }) {
  const [iconColor, setIconColor] = useState(initialIconColor);

  const colorOptions = [
    { value: "#00f2ff", label: "Cyan" },
    { value: "#ff0080", label: "Pink" },
    { value: "#00ff00", label: "Green" },
    { value: "#ffa500", label: "Orange" },
    { value: "#9333ea", label: "Purple" },
    { value: "#ffffff", label: "White" },
    { value: "#ffd700", label: "Gold" }
  ];

  const accents = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600"
  };

  const content =
  <div className="flex items-center gap-3">
      <div className="bg-[#000021] rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: iconColor }} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-[#525153] text-lg font-semibold leading-none" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      </div>
      <Select value={iconColor} onValueChange={setIconColor}>
        <SelectTrigger className="w-[100px] h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {colorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: option.value }} />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>;

  if (linkTo) {
    return (
      <Link
        to={createPageUrl(linkTo)}
        className="block bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer">
        {content}
      </Link>);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-sm transition-shadow">
      {content}
    </div>);

}