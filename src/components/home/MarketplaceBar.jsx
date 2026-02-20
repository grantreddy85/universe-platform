import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  TrendingUp,
  Wallet,
  Bell,
  FlaskConical,
  Eye,
  EyeOff,
  Users,
  ChevronRight,
  Circle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Mock marketplace + wallet data
const MOCK_LISTINGS = [
  { id: 1, title: "Neural Pathway Mapping", category: "Neuroscience", amount: "$2.5M", investors: 12, status: "live" },
  { id: 2, title: "CRISPR Gene Therapy", category: "Gene Therapy", amount: "$4.8M", investors: 23, status: "live" },
  { id: 3, title: "Microbiome Personalised Medicine", category: "Precision Health", amount: "$1.9M", investors: 8, status: "live" },
];

const MOCK_WALLET = {
  balance: "$14,250.00",
  pending: "$3,100.00",
  alerts: [
    { id: 1, text: "New investor interest in CRISPR project", time: "2h ago", type: "info" },
    { id: 2, text: "Royalty payment received: $840", time: "1d ago", type: "success" },
  ],
};

const STATUS_CONFIG = {
  pending:    { color: "text-amber-500",   bg: "bg-amber-50",   label: "Pending",    icon: Clock },
  in_review:  { color: "text-blue-500",    bg: "bg-blue-50",    label: "In Review",  icon: Clock },
  processing: { color: "text-purple-500",  bg: "bg-purple-50",  label: "Processing", icon: Clock },
  completed:  { color: "text-emerald-500", bg: "bg-emerald-50", label: "Completed",  icon: CheckCircle },
  rejected:   { color: "text-red-400",     bg: "bg-red-50",     label: "Rejected",   icon: AlertCircle },
};

export default function MarketplaceBar() {
  const [hideAmounts, setHideAmounts] = useState(false);

  const { data: labRequests = [] } = useQuery({
    queryKey: ["lab_requests_bar"],
    queryFn: () => base44.entities.LabRequest.list("-updated_date", 5),
  });

  const activeRequests = labRequests.filter(
    (r) => r.status === "pending" || r.status === "in_review" || r.status === "processing"
  );

  const mask = (val) => (hideAmounts ? "••••••" : val);

  return (
    <div className="fixed bottom-0 left-[68px] lg:left-[220px] right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-sm h-14 flex items-center gap-0 divide-x divide-gray-100 overflow-hidden">

      {/* Marketplace Listings */}
      <div className="flex items-center gap-3 px-5 h-full flex-shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Listings</span>
        </div>
        <div className="flex items-center gap-3 overflow-hidden">
          {MOCK_LISTINGS.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 flex-shrink-0">
              <Circle className="w-1.5 h-1.5 fill-green-400 text-green-400 flex-shrink-0" />
              <span className="text-[11px] font-medium text-gray-700 max-w-[110px] truncate">{item.title}</span>
              <span className="text-[11px] font-semibold text-green-600 flex-shrink-0">{mask(item.amount)}</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                <Users className="w-2.5 h-2.5" />{item.investors}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Wallet */}
      <div className="flex items-center gap-3 px-5 h-full flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Wallet</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Balance</p>
            <p className="text-xs font-bold text-gray-800">{mask(MOCK_WALLET.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Pending</p>
            <p className="text-xs font-semibold text-amber-600">{mask(MOCK_WALLET.pending)}</p>
          </div>
        </div>
        <button
          onClick={() => setHideAmounts((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
          title={hideAmounts ? "Show amounts" : "Hide amounts"}
        >
          {hideAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Alerts */}
      <div className="flex items-center gap-3 px-5 h-full flex-shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Bell className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Alerts</span>
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {MOCK_WALLET.alerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 flex-shrink-0">
              <span className="text-[11px] text-amber-700 max-w-[160px] truncate">{alert.text}</span>
              <span className="text-[10px] text-amber-400 flex-shrink-0">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lab Requests */}
      <div className="flex items-center gap-3 px-5 h-full min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lab Requests</span>
          {activeRequests.length > 0 && (
            <span className="text-[9px] font-semibold bg-teal-100 text-teal-600 rounded-full px-1.5 py-0.5 leading-none">
              {activeRequests.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {labRequests.length === 0 ? (
            <span className="text-[11px] text-gray-300">No requests</span>
          ) : (
            labRequests.slice(0, 5).map((req) => {
              const sc = STATUS_CONFIG[req.status] || { color: "text-gray-400", bg: "bg-gray-50", label: req.status };
              return (
                <div key={req.id} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 flex-shrink-0 shadow-sm min-w-[180px]">
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-500" strokeWidth={1.8} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{req.title}</p>
                    <p className="text-[10px] text-gray-400 truncate leading-tight">{req.description || req.request_type?.replace("_", " ") || "Lab Request"}</p>
                    <span className={`inline-block mt-0.5 text-[9px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Link to={createPageUrl("Labs")} className="flex-shrink-0">
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
    </div>
  );
}