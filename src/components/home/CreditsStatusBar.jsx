import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreditsStatusBar({ userEmail }) {
  const { data: subscription } = useQuery({
    queryKey: ["subscription", userEmail],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    select: (data) => data[0],
  });

  // Auto-create trial subscription if none exists
  const createTrialMutation = {
    isPending: false,
  };

  if (!userEmail) return null;

  // No subscription yet — show trial prompt
  if (!subscription) {
    return (
      <Link to={createPageUrl("Pricing")}>
        <div className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 hover:shadow-sm transition-all cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">Start your 30-day free trial</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Get 100 free credits — no card required. Full access to all AI features.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>
      </Link>
    );
  }

  const { plan, credits_balance, trial_ends_at, status } = subscription;

  // Calculate trial days remaining
  const trialDaysLeft = trial_ends_at
    ? Math.max(0, Math.ceil((new Date(trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const isTrialExpiringSoon = plan === "trial" && trialDaysLeft !== null && trialDaysLeft <= 7;
  const isLowCredits = (credits_balance ?? 0) < 20;

  if (!isTrialExpiringSoon && !isLowCredits) return null;

  return (
    <Link to={createPageUrl("Pricing")}>
      <div className={`mb-8 flex items-center gap-3 px-5 py-3.5 rounded-xl border hover:shadow-sm transition-all cursor-pointer group ${
        isTrialExpiringSoon
          ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isTrialExpiringSoon ? "bg-amber-100" : "bg-red-100"
        }`}>
          <Clock className={`w-4 h-4 ${isTrialExpiringSoon ? "text-amber-500" : "text-red-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          {isTrialExpiringSoon && (
            <>
              <p className="text-xs font-semibold text-gray-700">Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Choose a plan to keep your access. You have {credits_balance} credits remaining.</p>
            </>
          )}
          {!isTrialExpiringSoon && isLowCredits && (
            <>
              <p className="text-xs font-semibold text-gray-700">Running low on credits ({credits_balance} left)</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Top up to continue using AI-powered features without interruption.</p>
            </>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}