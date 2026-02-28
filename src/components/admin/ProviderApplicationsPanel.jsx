import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STATUS_STYLES = {
  pending: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  approved: { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  rejected: { color: "text-red-500", bg: "bg-red-50", icon: XCircle },
};

function ApplicationRow({ app, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);

  const st = STATUS_STYLES[app.status] || STATUS_STYLES.pending;
  const Icon = st.icon;

  let org = {};
  let services = [];
  try { org = JSON.parse(app.qualifications); } catch (_) {}
  try { services = JSON.parse(app.desired_services); } catch (_) {}

  const handleAction = async (action) => {
    setActing(true);
    await onAction(app.id, action, notes);
    setActing(false);
    setExpanded(false);
  };

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#000021] flex items-center justify-center">
            <Beaker className="w-4 h-4 text-[#00F2FF]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{org.institution_name || app.user_email}</p>
            <p className="text-xs text-gray-400">{app.user_email} · {services.length} service{services.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${st.bg} ${st.color}`}>
            <Icon className="w-3 h-3" />
            {app.status}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
          {/* Org details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {org.institution_type && <div><span className="text-gray-400">Type: </span><span className="text-gray-700">{org.institution_type}</span></div>}
            {org.contact_name && <div><span className="text-gray-400">Contact: </span><span className="text-gray-700">{org.contact_name}</span></div>}
            {org.location && <div><span className="text-gray-400">Location: </span><span className="text-gray-700">{org.location}</span></div>}
            {org.accreditations && <div><span className="text-gray-400">Accreditations: </span><span className="text-gray-700">{org.accreditations}</span></div>}
            {org.website && <div className="col-span-2"><span className="text-gray-400">Website: </span><a href={org.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{org.website}</a></div>}
          </div>
          {org.bio && <p className="text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-100">{org.bio}</p>}

          {/* Services */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Services ({services.length})</p>
            <div className="space-y-2">
              {services.map((svc, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">{svc.service_name}</span>
                    <span className="text-gray-400 capitalize">{svc.service_type} · {svc.category?.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{svc.description}</p>
                  <div className="flex gap-4 text-gray-500">
                    {svc.price_from && <span>💲 ${svc.price_from} {svc.price_unit}</span>}
                    {svc.turnaround_days && <span>⏱ {svc.turnaround_days} days</span>}
                    {svc.machine_name && <span>🔬 {svc.machine_name}</span>}
                    {svc.serial_number && <span>SN: {svc.serial_number}</span>}
                  </div>
                  {svc.subtypes?.filter(Boolean).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {svc.subtypes.filter(Boolean).map((st, j) => (
                        <span key={j} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{st}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Admin action */}
          {app.status === "pending" && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <Textarea
                placeholder="Admin notes (optional — shown to applicant on rejection)"
                className="text-xs bg-white"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                  disabled={acting}
                  onClick={() => handleAction("approved")}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & List Services
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 flex-1"
                  disabled={acting}
                  onClick={() => handleAction("rejected")}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}

          {app.status !== "pending" && app.admin_notes && (
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-100">
              <span className="font-medium">Admin notes: </span>{app.admin_notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProviderApplicationsPanel() {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["provider-applications"],
    queryFn: () => base44.entities.ProviderApplication.list("-created_date", 50),
  });

  const handleAction = async (applicationId, action, notes) => {
    await base44.functions.invoke("approveProviderApplication", {
      application_id: applicationId,
      action,
      admin_notes: notes,
    });
    queryClient.invalidateQueries({ queryKey: ["provider-applications"] });
  };

  const pending = applications.filter(a => a.status === "pending");
  const reviewed = applications.filter(a => a.status !== "pending");

  if (isLoading) return <p className="text-xs text-gray-400 text-center py-4">Loading applications...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Provider Applications</p>
        {pending.length > 0 && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {pending.length} pending
          </span>
        )}
      </div>

      {applications.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">No applications yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map(app => (
            <ApplicationRow key={app.id} app={app} onAction={handleAction} />
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Reviewed</p>
          <div className="space-y-2">
            {reviewed.map(app => (
              <ApplicationRow key={app.id} app={app} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}