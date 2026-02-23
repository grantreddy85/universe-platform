import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Calendar, FolderKanban, Box, Shield, Globe, Lock, CheckCircle2, UserPlus, Send, Link2, Building, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null); // "success" | "error"
  const [orcidInput, setOrcidInput] = useState("");
  const [orcidSaving, setOrcidSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setOrcidInput(u?.orcid_id || "");
    }).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["user-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 100),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["user-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 100),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Profile</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.full_name || "Researcher"}
            </h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Researcher</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">Full Name</span>
            <span className="text-gray-600 ml-auto">{user.full_name || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">Organization</span>
            <span className="text-gray-600 ml-auto">{user.organization || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">ORCID</span>
            <span className="text-gray-600 ml-auto">{user.orcid_id || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">Email</span>
            <span className="text-gray-600 ml-auto">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">Phone</span>
            <span className="text-gray-600 ml-auto">{user.phone || "Not set"}</span>
          </div>
        </div>
      </div>

      {/* ORCID */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4 text-[#A6CE39]" />
          <h3 className="text-sm font-semibold text-gray-900">ORCID iD</h3>
          {user.orcid_id && (
            <span className="ml-auto text-[10px] bg-[#A6CE39]/10 text-[#5a7a00] font-medium px-2 py-0.5 rounded-full">Linked</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Your unique researcher identifier used to attribute assets and publications across platforms.</p>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-400 flex-shrink-0">orcid.org/</span>
          <Input
            placeholder="0000-0000-0000-0000"
            value={orcidInput}
            onChange={(e) => setOrcidInput(e.target.value)}
            className="text-sm font-mono"
          />
          <Button
            size="sm"
            disabled={orcidSaving || orcidInput === (user.orcid_id || "")}
            onClick={async () => {
              setOrcidSaving(true);
              await base44.auth.updateMe({ orcid_id: orcidInput });
              const updated = await base44.auth.me();
              setUser(updated);
              setOrcidSaving(false);
            }}
            className="bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90 whitespace-nowrap"
          >
            {orcidSaving ? "Saving…" : "Save"}
          </Button>
        </div>
        {user.orcid_id && (
          <a
            href={`https://orcid.org/${user.orcid_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#A6CE39] hover:underline mt-2"
          >
            <Link2 className="w-3 h-3" /> View ORCID profile
          </a>
        )}
      </div>

      {/* Subscription & Visibility */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Access</h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              user.subscription_status === "subscribed" ? "bg-violet-50" : "bg-blue-50"
            }`}>
              {user.subscription_status === "subscribed"
                ? <Lock className="w-4 h-4 text-violet-600" />
                : <Globe className="w-4 h-4 text-blue-600" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {user.subscription_status === "subscribed" ? "Private Subscription" : "Free — Ecosystem Contributor"}
              </p>
              <p className="text-xs text-gray-400">
                {user.subscription_status === "subscribed"
                  ? "Your projects can be kept private."
                  : "Shared projects contribute to platform-wide research. Free forever."}
              </p>
            </div>
          </div>
          <Badge className={user.subscription_status === "subscribed"
            ? "bg-violet-100 text-violet-700 text-[10px]"
            : "bg-blue-100 text-blue-700 text-[10px]"
          }>
            {user.subscription_status === "subscribed" ? "Subscribed" : "Free"}
          </Badge>
        </div>

        {user.subscription_status !== "subscribed" ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-1">Upgrade to Private Subscription</p>
            <p className="text-xs text-gray-400 mb-3">Keep any of your projects fully private while still accessing the full UniVerse platform.</p>
            <ul className="text-[11px] text-gray-500 space-y-1 mb-3">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Full data privacy for all projects</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Unlimited private vault & assets</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Still collaborate with ecosystem users</li>
            </ul>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-xs"
              onClick={async () => {
                await base44.auth.updateMe({ subscription_status: "subscribed", subscription_started: new Date().toISOString().split("T")[0] });
                const updated = await base44.auth.me();
                setUser(updated);
              }}
            >
              Subscribe (Demo)
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {user.subscription_started ? `Active since ${format(new Date(user.subscription_started), "MMMM yyyy")}` : "Active subscription"}
            </p>
            <button
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
              onClick={async () => {
                await base44.auth.updateMe({ subscription_status: "free" });
                const updated = await base44.auth.me();
                setUser(updated);
              }}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Invite User */}
      {user.role === "admin" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Invite a Researcher</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Send an invitation email so they can sign up and start their own fresh account.</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@university.edu"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteStatus(null); }}
              className="text-sm"
            />
            <Button
              size="sm"
              disabled={!inviteEmail || inviting}
              onClick={async () => {
                setInviting(true);
                try {
                  await base44.users.inviteUser(inviteEmail, "user");
                  setInviteStatus("success");
                  setInviteEmail("");
                } catch {
                  setInviteStatus("error");
                } finally {
                  setInviting(false);
                }
              }}
              className="flex items-center gap-1.5 whitespace-nowrap bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90"
            >
              <Send className="w-3.5 h-3.5" />
              {inviting ? "Sending…" : "Send Invite"}
            </Button>
          </div>
          {inviteStatus === "success" && <p className="text-xs text-emerald-600 mt-2">Invitation sent successfully!</p>}
          {inviteStatus === "error" && <p className="text-xs text-red-500 mt-2">Failed to send invite. Please check the email and try again.</p>}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Overview</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Projects</p>
              <p className="text-lg font-semibold text-gray-900">{projects.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Box className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">In Validation</p>
              <p className="text-lg font-semibold text-gray-900">0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Validated Assets</p>
              <p className="text-lg font-semibold text-gray-900">
                {assets.filter((a) => a.status === "validated" || a.status === "tokenised").length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Box className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tokenised</p>
              <p className="text-lg font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}