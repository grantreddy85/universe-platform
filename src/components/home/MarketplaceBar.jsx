import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  Bell,
  FileText,
  Users,
  AlertCircle,
  CheckCircle } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Mock data — replace with real data once Marketplace entity is live
const LISTINGS = [
{ id: 1, title: "Neural Pathway Mapping in C. elegans", category: "Neuroscience", amount: 2500000, investors: 12, status: "live" },
{ id: 2, title: "CRISPR-Based Gene Therapy for Rare Diseases", category: "Gene Therapy", amount: 4800000, investors: 23, status: "live" },
{ id: 3, title: "Microbiome Analysis for Personalized Medicine", category: "Precision Health", amount: 1900000, investors: 8, status: "closing" }];


const WALLET = {
  balance: 128450.0,
  pending: 14200.0,
  earned: 43600.0
};

const HOLDINGS = [
{ name: "Validated Assets", value: 48200, color: "#10b981" },
{ name: "Tokenised IP", value: 43600, color: "#6366f1" },
{ name: "Pending Royalties", value: 14200, color: "#f59e0b" },
{ name: "Liquid Balance", value: 22450, color: "#3b82f6" }];


const ALERTS = [
{ id: 1, type: "info", text: "New investor expressed interest in your CRISPR project", time: "2h ago" },
{ id: 2, type: "success", text: "Royalty payment of $1,200 received", time: "1d ago" },
{ id: 3, type: "warning", text: "Validation deadline in 3 days for Cohort B", time: "2d ago" }];


const REQUESTS = [
{ id: 1, title: "Data access request – Stanford Lab", status: "pending", time: "4h ago" },
{ id: 2, title: "Collaboration invite – Dr. Patel", status: "approved", time: "1d ago" }];


const alertIcon = { info: Bell, success: CheckCircle, warning: AlertCircle };
const alertColor = { info: "text-blue-500 bg-blue-50", success: "text-emerald-500 bg-emerald-50", warning: "text-amber-500 bg-amber-50" };
const reqColor = { pending: "bg-amber-100 text-amber-600", approved: "bg-emerald-100 text-emerald-600" };

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function MarketplaceBar() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="mb-10 bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#000021] text-[#00F2FF] rounded-md w-6 h-6 flex items-center justify-center">
            <Store className="text-[#00F2FF] lucide lucide-store w-3.5 h-3.5" strokeWidth={1.8} />
          </div>
          <h2 className="text-[#525153] text-xs font-semibold uppercase tracking-wider">MARKETPLACE</h2>
          <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 italic">Coming Soon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-4 h-4 text-gray-400" />
              {ALERTS.length > 0 &&
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              }
            </div>
            <button
              onClick={() => setHidden((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50">

              {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hidden ? "Show financials" : "Hide financials"}
            </button>
          </div>
          <Link to={createPageUrl("Tokenisation")}>
            <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900 h-7 px-2">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

        {/* Current Listings */}
        <div className="p-4 space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Current Listings
          </p>
          {LISTINGS.map((item) =>
          <div key={item.id} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#525153] text-xs font-semibold truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{item.category}</span>
                  {!hidden &&
                <span className="text-[10px] font-semibold text-green-600">{fmt(item.amount)}</span>
                }
                  {hidden &&
                <span className="text-[10px] text-gray-300">••••</span>
                }
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${item.status === "live" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Digital Asset Holdings */}
        <div className="p-4 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3 h-3" /> Digital Asset Holdings
          </p>
          <div className="flex items-center gap-3">
            {/* Pie Chart */}
            <div className="w-20 h-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={HOLDINGS}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={36}
                    paddingAngle={2}
                    dataKey="value">

                    {HOLDINGS.map((entry, i) =>
                    <Cell key={i} fill={hidden ? "#e5e7eb" : entry.color} />
                    )}
                  </Pie>
                  {!hidden && <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 10, padding: "2px 6px" }} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-1.5">
              {HOLDINGS.map((h) =>
              <div key={h.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hidden ? "#d1d5db" : h.color }} />
                    <span className="text-[10px] text-gray-500 truncate">{h.name}</span>
                  </div>
                  {hidden ?
                <span className="text-[10px] text-gray-300 font-semibold tracking-widest">••••</span> :

                <span className="text-[10px] font-semibold text-gray-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(h.value)}</span>
                }
                </div>
              )}
            </div>
          </div>
          <div className="pt-1 border-t border-gray-50">
            <p className="text-[10px] text-gray-300 italic">Coming Soon: Live wallet</p>
          </div>
        </div>



        {/* Requests */}
        <div className="p-4 space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Requests
          </p>
          {REQUESTS.map((req) =>
          <div key={req.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-gray-400" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-700 leading-snug truncate">{req.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${reqColor[req.status] || "bg-gray-100 text-gray-500"}`}>
                    {req.status}
                  </span>
                  <span className="text-[10px] text-gray-300">{req.time}</span>
                </div>
              </div>
            </div>
          )}
          <div className="pt-1 border-t border-gray-50">
            <p className="text-[10px] text-gray-300 italic">Coming Soon: Live requests</p>
          </div>
        </div>

      </div>
    </div>);

}