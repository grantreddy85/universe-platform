import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function StatsCard({ label, value, icon: Icon, accent = "blue", linkTo }) {
  const accents = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600"
  };

  const content =
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${accents[accent]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-[#525153] text-lg font-semibold leading-none" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      </div>
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