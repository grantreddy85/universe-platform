import React from "react";
import { Globe, Users, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function EcosystemBanner({ projects, subscriptionStatus, compact }) {
  const hasPrivate = projects.some(p => p.visibility_setting === "private");
  const sharedCount = projects.filter(p => p.visibility_setting === "platform_shared").length;
  const isSubscribed = subscriptionStatus === "subscribed";

  if (projects.length === 0) return null;

  // If user has private projects but no subscription — prompt to subscribe or share
  if (hasPrivate && !isSubscribed) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 ${compact ? "p-3" : "p-5"}`}>
        <div className={`rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 ${compact ? "w-7 h-7" : "w-9 h-9"}`}>
          <Lock className={`text-amber-600 ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-amber-800 ${compact ? "text-xs" : "text-sm"}`}>You have private projects without a subscription</p>
          <p className={`text-amber-600 mt-0.5 ${compact ? "text-[10px]" : "text-xs"}`}>
            Subscribe to keep your projects private, or switch them to shared to access the free tier.
          </p>
        </div>
        <Link to={createPageUrl("Profile")}>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs flex-shrink-0 h-7 px-2">
            Manage
          </Button>
        </Link>
      </div>
    );
  }

  // Ecosystem awareness banner for shared users
  if (sharedCount > 0) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-lg flex items-start gap-3 ${compact ? "p-3" : "p-5"}`}>
        <div className={`rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 ${compact ? "w-7 h-7" : "w-9 h-9"}`}>
          <Globe className={`text-blue-600 ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-blue-900 ${compact ? "text-xs" : "text-sm"}`}>
            You're part of the UniVerse Ecosystem
          </p>
          <p className={`text-blue-600 mt-0.5 ${compact ? "text-[10px]" : "text-xs"}`}>
            {sharedCount} of your project{sharedCount !== 1 ? "s are" : " is"} contributing to platform-wide research.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Users className={`text-blue-400 ${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
          <Sparkles className={`text-violet-400 ${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        </div>
      </div>
    );
  }

  return null;
}