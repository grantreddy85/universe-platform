import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Database, Crown, ChevronRight, Sparkles, Clock, Shield, TrendingUp, Bell } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    key: "contributor",
    name: "Contributor",
    price: "Free",
    sub: "while you share data",
    description: "Full platform access in exchange for active, validated data contribution. Your data trains the UniVerse Model — a biomedical AI built exclusively from peer-validated science.",
    color: "border-emerald-200 bg-emerald-50/30",
    badge: "bg-emerald-100 text-emerald-700",
    icon: Database,
    iconColor: "text-emerald-600",
    requirement: "1 validated upload/30d · 1 validated asset/60d",
    credits: "Platform credits included",
    features: [
      "Unlimited projects & hypotheses",
      "Full cohort builder access",
      "RAG / Knowledge Base queries",
      "AI hypothesis generation",
      "Platform credits for AI features",
      "Attribution on every AI output your data influences",
      "Notification when your data is cited or reused",
      "IP Marketplace access — earn real revenue from validated research",
      "Your data trains UniVerse Model only — never shared externally",
    ],
  },
  {
    key: "trial",
    name: "30-Day Free Trial",
    price: "Free",
    sub: "for 30 days",
    description: "Full Pro access for 30 days with 100 starter credits. No card required.",
    color: "border-blue-200 bg-blue-50/30",
    badge: "bg-blue-100 text-blue-700",
    icon: Sparkles,
    iconColor: "text-blue-500",
    requirement: "Auto-starts on sign up",
    credits: "100 starter credits",
    features: [
      "Everything in Pro",
      "100 free starter credits",
      "30 days full access",
      "No credit card required",
      "Converts to Contributor or Pro",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$79",
    sub: "per month",
    description: "For power users and institutions who need full private access. Your data stays completely private — it is never used to train the UniVerse Model.",
    color: "border-violet-200 bg-violet-50/30",
    badge: "bg-violet-100 text-violet-700",
    icon: Crown,
    iconColor: "text-violet-600",
    requirement: "No contribution required",
    credits: "200 credits/month",
    features: [
      "Everything in Contributor",
      "200 credits/month",
      "Private vault (no data sharing)",
      "Priority validation queue",
      "Dedicated support",
      "Team collaboration (coming soon)",
    ],
    highlight: true,
  },
  {
    key: "credits_only",
    name: "Pay-as-you-go",
    price: "Credits",
    sub: "buy when needed",
    description: "No subscription. Purchase credit packs and use them whenever you need AI features.",
    color: "border-amber-200 bg-amber-50/30",
    badge: "bg-amber-100 text-amber-700",
    icon: Zap,
    iconColor: "text-amber-500",
    requirement: "No commitment",
    credits: "Buy packs from $10",
    features: [
      "Access to all AI features",
      "Credits never expire",
      "Buy in flexible packs",
      "No monthly commitment",
    ],
  },
];

const CREDIT_COSTS = [
  { action: "RAG Query", cost: 5, icon: "🔍" },
  { action: "AI Hypothesis Generation", cost: 10, icon: "💡" },
  { action: "Validation Request", cost: 20, icon: "🔬" },
  { action: "Infographic Generation", cost: 15, icon: "🖼️" },
];

const CREDIT_PACKS = [
  { credits: 100, price: 10, label: "Starter" },
  { credits: 300, price: 25, label: "Research", popular: true },
  { credits: 750, price: 50, label: "Power" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: user.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const createSubMutation = useMutation({
    mutationFn: (plan) => {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);
      return base44.entities.UserSubscription.create({
        user_email: user.email,
        plan: plan === "trial" ? "trial" : plan,
        status: "active",
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        credits_balance: plan === "trial" ? 100 : plan === "pro" ? 200 : 50,
        credits_used_total: 0,
        data_contribution_score: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.email] });
    },
  });

  const currentPlan = subscription?.plan;

  return (
    <div className="min-h-screen bg-[#fafbfc] px-6 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#525153] mb-3" style={{ fontFamily: "'Funnel Display', sans-serif" }}>
          Plans & Credits
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Start free. Share data to keep it free. Or subscribe for full private access.
        </p>
        {subscription && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Current plan: <span className="font-semibold capitalize">{subscription.plan?.replace(/_/g, " ")}</span>
            <span className="text-gray-300 mx-1">·</span>
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="font-semibold">{subscription.credits_balance ?? 0} credits</span>
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-14">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.key;
          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${plan.highlight ? "shadow-lg ring-2 ring-violet-300/40" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-4 h-4 ${plan.iconColor}`} />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.name}</span>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-800">{plan.price}</span>
                <span className="text-xs text-gray-400 ml-1">{plan.sub}</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{plan.description}</p>

              <div className="text-[10px] text-gray-400 mb-4 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {plan.requirement}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button disabled size="sm" className="w-full text-xs bg-gray-100 text-gray-400 cursor-default">
                  Current Plan
                </Button>
              ) : plan.key === "credits_only" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                  onClick={() => document.getElementById("credit-packs")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Buy Credits <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className={`w-full text-xs ${plan.highlight ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90"}`}
                  onClick={() => {
                    if (!subscription) {
                      createSubMutation.mutate(plan.key);
                    } else {
                      navigate(createPageUrl("Profile"));
                    }
                  }}
                >
                  {!subscription ? (plan.key === "trial" ? "Start Free Trial" : "Get Started") : "Switch Plan"}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Why Contribute */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Why Share Your Data With UniVerse?</h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Your data doesn't disappear into a black box. It trains the UniVerse Model — a biomedical AI built exclusively from peer-validated research.
              You retain full IP ownership and receive attribution every time your work shapes a platform discovery. And when your validated research is ready,
              you can list it on the <strong className="text-gray-600">IP Marketplace</strong> and earn real revenue from commercial licensing.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
            <span className="text-2xl">🧠</span>
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Co-author the UniVerse Model</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Every validated dataset you contribute shapes a biomedical AI that no single institution could build alone. Your name is on it.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
            <span className="text-2xl">🔔</span>
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Know when your work is used</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Every time your data influences a hypothesis or output on the platform, you receive a full attribution notification with lineage.
            </p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-5">
            <span className="text-2xl">💰</span>
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Earn real revenue from your IP</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Validated assets can be listed on the UniVerse IP Marketplace. When institutions license your research commercially, you receive royalty payments directly.
            </p>
          </div>
        </div>

        {/* Data transparency box */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Your data remains yours</p>
              <p className="text-[11px] text-gray-500">You retain full IP ownership. UniVerse holds a non-exclusive licence to train its models only. You can opt out at any time by switching to Pro.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Full audit trail</p>
              <p className="text-[11px] text-gray-500">Complete lineage tracking on every output. You always know where your data went and what it contributed to.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Visibility controls</p>
              <p className="text-[11px] text-gray-500">Set each vault to Private, Collaborators, or Platform-shared. Only platform-shared data contributes to model training.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributor Requirements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Keeping Your Contributor Access</h2>
        <p className="text-xs text-gray-400 mb-4 max-w-2xl">
          Contributor access is free because the platform relies on genuine, reproducible research data to build the UniVerse Model.
          To maintain access, you need to stay active and contribute real science — not just files.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "📅", title: "1 validated upload every 30 days", desc: "Upload must be original research data linked to a real cohort or analysis run. AI-generated content, duplicates, and standalone PDFs without supporting data do not qualify." },
            { icon: "✅", title: "1 validated asset every 60 days", desc: "A validated asset requires a completed workflow run, a reproducibility score, and approver sign-off. This ensures your contribution is genuine and reproducible — it cannot be shortcut." },
            { icon: "🪪", title: "ORCID verification recommended", desc: "Verifying your ORCID iD links your platform contributions to your academic identity, making your attribution citable and your IP Marketplace listings more credible to licensees." },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">{item.title}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-4 border-t border-gray-100 pt-4">
          If activity requirements are not met, your account will revert to a credit-only plan. All your existing projects and data remain accessible — you'll just need credits to use AI features.
        </p>
      </div>

      {/* Credit Packs */}
      <div id="credit-packs" className="bg-white rounded-2xl border border-gray-100 p-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Buy Credit Packs</h2>
        <p className="text-xs text-gray-400 mb-6">Credits never expire. Use them whenever you need.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.credits}
              className={`relative rounded-xl border-2 p-6 text-center ${pack.popular ? "border-amber-300 bg-amber-50/40" : "border-gray-100 bg-gray-50/50"}`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Best Value</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-2xl font-bold text-gray-800">{pack.credits}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">credits</p>
              <p className="text-xs font-medium text-gray-500 mb-4">{pack.label} Pack</p>
              <p className="text-xl font-bold text-gray-800 mb-4">${pack.price}</p>
              <Button
                size="sm"
                className={`w-full text-xs ${pack.popular ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-[#000021] text-[#00F2FF]"}`}
              >
                Buy Now
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-300 mt-6">
          Payment processing coming soon — credit top-ups will be available when Stripe is connected.
        </p>
      </div>
    </div>
  );
}