import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Search, FolderKanban, Archive, Users, FlaskConical, Coins, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ONBOARDING_KEY = "universe_onboarding_v1";

const steps = [
  {
    icon: null,
    title: "Welcome to UniVerse 🌌",
    subtitle: "Your end-to-end research platform",
    description:
      "UniVerse guides you from your first research question all the way through to a publishable, tokenised asset. Let's take a quick tour of the 5 key steps.",
    color: "from-[#000021] to-[#001a3a]",
    textColor: "text-[#00F2FF]",
  },
  {
    icon: Search,
    title: "Step 1 — Research",
    subtitle: "Start with a question",
    description:
      "Use the Research tab like a supercharged AI search engine. Ask anything about your field, explore biomedical literature, and save key findings directly to your project notes.",
    color: "from-blue-900 to-blue-800",
    textColor: "text-blue-200",
    navigateTo: "Search",
  },
  {
    icon: FolderKanban,
    title: "Step 2 — Project & Vault",
    subtitle: "Organise your work",
    description:
      "Create a Project for each research initiative. Upload your existing documents and data into the Vault first — this gives the AI full context before you start writing notes or hypotheses.",
    color: "from-purple-900 to-purple-800",
    textColor: "text-purple-200",
    navigateTo: "Projects",
  },
  {
    icon: Users,
    title: "Step 3 — Cohorts & Hypotheses",
    subtitle: "Define your study population",
    description:
      "Formulate hypotheses from your notes, then use the Cohort Builder to define your study population. The AI will suggest filters, sample sizes, and can link cohorts directly to your hypotheses.",
    color: "from-emerald-900 to-emerald-800",
    textColor: "text-emerald-200",
    navigateTo: "Projects",
  },
  {
    icon: FlaskConical,
    title: "Step 4 — Workflows & Labs",
    subtitle: "Run your experiments",
    description:
      "Design analytical workflows and connect with lab services for physical experiments. The AI can match your workflow requirements to available lab services automatically.",
    color: "from-orange-900 to-orange-800",
    textColor: "text-orange-200",
    navigateTo: "Labs",
  },
  {
    icon: Coins,
    title: "Step 5 — Validate & Publish",
    subtitle: "Turn research into assets",
    description:
      "Validate your findings, generate reproducibility scores, and publish your research as a tokenised asset on the UniVerse marketplace. Every step of your journey is saved and queryable.",
    color: "from-yellow-900 to-yellow-800",
    textColor: "text-yellow-200",
    navigateTo: "Validations",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setTimeout(() => setIsOpen(true), 800);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden max-w-md border-0 shadow-2xl">
        {/* Gradient Header */}
        <div className={`bg-gradient-to-br ${step.color} p-8 text-white relative`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Icon className={`w-6 h-6 ${step.textColor}`} />
            </div>
          )}

          {!Icon && (
            <div className="mb-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994076dc777dd78309c97c9/6a7cc2cbe_UniVerseTDAJ-Icon2Dark.png"
                alt="UniVerse"
                className="h-12 w-10 object-contain"
              />
            </div>
          )}

          <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${step.textColor}`}>
            {step.subtitle}
          </p>
          <h2 className="text-2xl font-bold leading-tight">{step.title}</h2>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-6 mb-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`rounded-full transition-all ${
                  idx === currentStep
                    ? "w-5 h-2 bg-[#000021]"
                    : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                className="bg-[#000021] hover:bg-[#000021]/90 text-[#00F2FF]"
                onClick={handleNext}
              >
                {isLast ? "Get Started" : "Next"}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}