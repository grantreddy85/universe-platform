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
  <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-[#525153] mt-1.5 text-2xl font-semibold">{value}</p>
      </div>
      <div className={`w-9 h-9 rounded-lg ${accents[accent]} flex items-center justify-center`}>
        <Icon className="w-4 h-4" strokeWidth={1.8} />
      </div>
    </div>;


  if (linkTo) {
    return (
      <Link
        to={createPageUrl(linkTo)}
        className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer">

        {content}
      </Link>);

  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      {content}
    </div>);

}