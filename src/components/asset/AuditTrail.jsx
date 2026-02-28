import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Shield, Hash, ChevronDown, ChevronRight, Copy, CheckCircle2,
  Lightbulb, FlaskConical, BarChart3, ShieldCheck, Database, BookOpen,
  Globe, FileText, Users, Clock, Link2, Upload, Pencil, Tag, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const EVENT_CONFIG = {
  asset_created:              { icon: Star,         color: "text-violet-500", bg: "bg-violet-50",   label: "Asset Created" },
  hypothesis_added:           { icon: Lightbulb,    color: "text-amber-500",  bg: "bg-amber-50",    label: "Hypothesis Added" },
  cohort_defined:             { icon: Users,         color: "text-teal-500",   bg: "bg-teal-50",     label: "Cohort Defined" },
  workflow_run:               { icon: BarChart3,     color: "text-purple-500", bg: "bg-purple-50",   label: "Workflow Run" },
  data_uploaded:              { icon: Upload,        color: "text-blue-500",   bg: "bg-blue-50",     label: "Data Uploaded" },
  validation_submitted:       { icon: Shield,        color: "text-indigo-500", bg: "bg-indigo-50",   label: "Validation Submitted" },
  validation_approved:        { icon: CheckCircle2,  color: "text-emerald-500",bg: "bg-emerald-50",  label: "Validation Approved" },
  validation_rejected:        { icon: ShieldCheck,   color: "text-red-500",    bg: "bg-red-50",      label: "Validation Rejected" },
  attribution_updated:        { icon: Users,         color: "text-blue-500",   bg: "bg-blue-50",     label: "Attribution Updated" },
  topic_clusters_updated:     { icon: Tag,           color: "text-teal-500",   bg: "bg-teal-50",     label: "Topics Updated" },
  status_changed:             { icon: Clock,         color: "text-gray-500",   bg: "bg-gray-50",     label: "Status Changed" },
  tokenised:                  { icon: Hash,          color: "text-violet-500", bg: "bg-violet-50",   label: "Tokenised" },
  published_to_marketplace:   { icon: Globe,         color: "text-blue-500",   bg: "bg-blue-50",     label: "Published to Marketplace" },
  licensed:                   { icon: FileText,      color: "text-emerald-500",bg: "bg-emerald-50",  label: "Licensed" },
  lab_request_submitted:      { icon: FlaskConical,  color: "text-teal-500",   bg: "bg-teal-50",     label: "Lab Request Submitted" },
  lab_results_uploaded:       { icon: Database,      color: "text-blue-500",   bg: "bg-blue-50",     label: "Lab Results Uploaded" },
  note_linked:                { icon: BookOpen,      color: "text-amber-500",  bg: "bg-amber-50",    label: "Note Linked" },
  contributor_added:          { icon: Users,         color: "text-indigo-500", bg: "bg-indigo-50",   label: "Contributor Added" },
  admin_review:               { icon: Shield,        color: "text-gray-500",   bg: "bg-gray-50",     label: "Admin Review" },
};

function HashChip({ hash, label }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return null;
  const short = hash.slice(0, 8) + "…" + hash.slice(-6);
  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-0.5 rounded transition-colors"
      title={hash}
    >
      <Hash className="w-2.5 h-2.5" />
      {label && <span className="text-gray-400 mr-0.5">{label}:</span>}
      {short}
      {copied ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 ml-0.5" /> : <Copy className="w-2.5 h-2.5 ml-0.5 opacity-50" />}
    </button>
  );
}

function AuditEventRow({ event, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.status_changed;
  const Icon = cfg.icon;

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-9 bottom-0 w-px bg-gray-100" />
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 z-10 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-800">{cfg.label}</span>
              <span className="text-[10px] text-gray-400">{event.actor_email}</span>
              {event.actor_role && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{event.actor_role}</Badge>
              )}
              {event.blockchain_tx_id && (
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-medium">
                  <Link2 className="w-2.5 h-2.5" /> On-chain
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {format(new Date(event.created_date), "d MMM yyyy, HH:mm")}
            </span>
            {(event.event_hash || event.metadata) && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-300 hover:text-gray-500 transition-colors">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Hashes */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {event.event_hash && <HashChip hash={event.event_hash} label="hash" />}
          {event.previous_hash && event.previous_hash !== "0".repeat(64) && (
            <HashChip hash={event.previous_hash} label="prev" />
          )}
          {event.blockchain_tx_id && <HashChip hash={event.blockchain_tx_id} label="tx" />}
        </div>

        {/* Expanded metadata */}
        {expanded && event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Event Metadata</p>
            <pre className="text-[10px] text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditTrail({ assetId }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["audit-trail", assetId],
    queryFn: () => base44.entities.AuditEvent.filter({ asset_id: assetId }, "created_date", 100),
    enabled: !!assetId,
  });

  const chainIntegrity = events.length > 1 ? events.every((event, i) => {
    if (i === 0) return true;
    return event.previous_hash === events[i - 1].event_hash;
  }) : null;

  if (isLoading) return <p className="text-xs text-gray-400 text-center py-6">Loading audit trail…</p>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-700">Audit Trail</h2>
          {events.length > 0 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {events.length} events
            </span>
          )}
        </div>
        {chainIntegrity !== null && (
          <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${
            chainIntegrity ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}>
            {chainIntegrity ? <CheckCircle2 className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
            {chainIntegrity ? "Chain Intact" : "Chain Break Detected"}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10">
          <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-xs text-gray-400">No audit events recorded yet.</p>
          <p className="text-[10px] text-gray-300 mt-1">Events are logged as actions are taken on this asset.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => (
            <AuditEventRow
              key={event.id}
              event={event}
              index={i}
              isLast={i === events.length - 1}
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
        <Hash className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Each event is SHA-256 hashed and chained to the previous event, creating a tamper-evident audit log ready for blockchain anchoring. The <span className="font-medium text-gray-500">event hash</span> and <span className="font-medium text-gray-500">previous hash</span> fields can be verified on-chain once a blockchain transaction ID is assigned.
        </p>
      </div>
    </div>
  );
}