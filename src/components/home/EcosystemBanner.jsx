import React from "react";
import { Globe, Users, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function EcosystemBanner({ projects, subscriptionStatus }) {
  const hasPrivate = projects.some(p => p.visibility_setting === "private");
  const sharedCount = projects.filter(p => p.visibility_setting === "platform_shared").length;
  const isSubscribed = subscriptionStatus === "subscribed";

  if (projects.length === 0) return null;

  // If user has private projects but no subscription — prompt to subscribe or share
  if (hasPrivate && !isSubscribed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">You have private projects without a subscription</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Subscribe to keep your projects private, or switch them to shared to access the free tier and join the UniVerse research ecosystem.
          </p>
        </div>
        <Link to={createPageUrl("Profile")}>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs flex-shrink-0">
            Manage
          </Button>
        </Link>
      </div>
    );
  }

  // Ecosystem awareness banner for shared users
  if (sharedCount > 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">
            You're part of the UniVerse Ecosystem
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {sharedCount} of your project{sharedCount !== 1 ? "s are" : " is"} contributing to platform-wide research. UniVerse AI may include your data in multidisciplinary hypothesis generation.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    );
  }

  return null;
}