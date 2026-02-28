import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Beaker, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BecomeProviderBanner({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("provider_banner_dismissed") === "true"
  );
  const [form, setForm] = useState({ desired_services: "", qualifications: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (dismissed) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.ProviderApplication.create({
      user_email: userEmail,
      desired_services: form.desired_services,
      qualifications: form.qualifications,
      status: "pending"
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setDismissed(true);
      localStorage.setItem("provider_banner_dismissed", "true");
    }, 2000);
  };

  return (
    <>
      <div className="mt-10 rounded-xl border border-dashed border-[#00F2FF]/40 bg-[#000021]/5 px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#000021] flex items-center justify-center flex-shrink-0">
            <Beaker className="w-5 h-5 text-[#00F2FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Are you a lab or service provider?</p>
            <p className="text-xs text-gray-500 mt-0.5">List your equipment and services on UniVerse Labs to connect with researchers.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            className="bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90 text-xs"
            onClick={() => setOpen(true)}
          >
            Become a Provider <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem("provider_banner_dismissed", "true");
            }}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Become a Service Provider</DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-gray-700 font-medium">Application submitted!</p>
              <p className="text-xs text-gray-500 mt-1">We'll review your application and get back to you soon.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">What services or equipment can you offer?</Label>
                <Textarea
                  placeholder="e.g. Flow cytometry, Mass spectrometry, PCR services..."
                  className="text-sm"
                  rows={3}
                  value={form.desired_services}
                  onChange={(e) => setForm((f) => ({ ...f, desired_services: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Your qualifications or institution</Label>
                <Textarea
                  placeholder="e.g. University core facility, CRO with ISO accreditation..."
                  className="text-sm"
                  rows={3}
                  value={form.qualifications}
                  onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))}
                />
              </div>
              <Button
                className="w-full bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90"
                disabled={!form.desired_services || !form.qualifications || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}