import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Beaker, ChevronRight, X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICE_CATEGORIES = [
  { value: "biological_cellular", label: "Biological & Cellular Systems" },
  { value: "molecular_analytical", label: "Molecular & Analytical Systems" },
  { value: "protein_immunology", label: "Protein & Immunology Systems" },
  { value: "structural_chemical", label: "Structural Chemical Synthesis & Systems" },
];

const EMPTY_SERVICE = {
  service_name: "",
  service_type: "", // "equipment" | "assay" | "analysis"
  category: "",
  description: "",
  // Equipment-specific
  machine_name: "",
  serial_number: "",
  software_used: "",
  // Assay-specific (e.g. cell culture types)
  subtypes: [""],
  // Pricing
  price_from: "",
  price_unit: "per sample",
  turnaround_days: "",
};

function SectionHeading({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-6 h-6 rounded-full bg-[#000021] text-[#00F2FF] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ServiceItem({ service, index, onChange, onRemove, showRemove }) {
  const updateField = (field, value) => onChange(index, { ...service, [field]: value });
  const updateSubtype = (i, value) => {
    const updated = [...service.subtypes];
    updated[i] = value;
    onChange(index, { ...service, subtypes: updated });
  };
  const addSubtype = () => onChange(index, { ...service, subtypes: [...service.subtypes, ""] });
  const removeSubtype = (i) => onChange(index, { ...service, subtypes: service.subtypes.filter((_, idx) => idx !== i) });

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service #{index + 1}</p>
        {showRemove && (
          <button onClick={() => onRemove(index)} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Service name + category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-600 mb-1.5 block">Service / Equipment Name <span className="text-red-400">*</span></Label>
          <Input
            placeholder="e.g. Flow Cytometry, Cell Culture"
            value={service.service_name}
            onChange={(e) => updateField("service_name", e.target.value)}
            className="text-sm bg-white"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-600 mb-1.5 block">Category <span className="text-red-400">*</span></Label>
          <Select value={service.category} onValueChange={(v) => updateField("category", v)}>
            <SelectTrigger className="text-sm bg-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Service type */}
      <div>
        <Label className="text-xs text-gray-600 mb-1.5 block">Service Type <span className="text-red-400">*</span></Label>
        <div className="flex gap-2">
          {["equipment", "assay", "analysis"].map((t) => (
            <button
              key={t}
              onClick={() => updateField("service_type", t)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all capitalize ${
                service.service_type === t
                  ? "bg-[#000021] text-[#00F2FF] border-[#000021]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {t === "equipment" ? "🔬 Equipment / Machine" : t === "assay" ? "🧫 Assay / Protocol" : "📊 Data Analysis"}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="text-xs text-gray-600 mb-1.5 block">Description <span className="text-red-400">*</span></Label>
        <Textarea
          placeholder="Describe what this service offers and what researchers can use it for..."
          className="text-sm bg-white"
          rows={2}
          value={service.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      {/* Equipment-specific fields */}
      {service.service_type === "equipment" && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <p className="text-xs font-medium text-gray-500">Equipment Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600 mb-1.5 block">Machine / Instrument Name</Label>
              <Input
                placeholder="e.g. BD FACSAria III"
                value={service.machine_name}
                onChange={(e) => updateField("machine_name", e.target.value)}
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1.5 block">Serial Number</Label>
              <Input
                placeholder="e.g. SN-2024-XXXXX"
                value={service.serial_number}
                onChange={(e) => updateField("serial_number", e.target.value)}
                className="text-sm bg-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">Software / Analysis Platform</Label>
            <Input
              placeholder="e.g. FlowJo v10, FACSDiva 9.0"
              value={service.software_used}
              onChange={(e) => updateField("software_used", e.target.value)}
              className="text-sm bg-white"
            />
          </div>
        </div>
      )}

      {/* Assay subtypes (e.g. cell types for cell culture) */}
      {(service.service_type === "assay" || service.service_type === "analysis") && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-600">
              {service.service_type === "assay" ? "Specific subtypes / variants offered" : "Analysis methods / tools"}
            </Label>
            <button
              onClick={addSubtype}
              className="text-xs text-[#000021] hover:text-[#000021]/70 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {service.subtypes.map((st, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={
                    service.service_type === "assay"
                      ? "e.g. HEK293T, Primary neurons, iPSC-derived cardiomyocytes"
                      : "e.g. Differential expression, GSEA, Network analysis"
                  }
                  value={st}
                  onChange={(e) => updateSubtype(i, e.target.value)}
                  className="text-sm bg-white"
                />
                {service.subtypes.length > 1 && (
                  <button onClick={() => removeSubtype(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-3">Pricing & Turnaround</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">Price From (USD) <span className="text-red-400">*</span></Label>
            <Input
              type="number"
              placeholder="e.g. 150"
              value={service.price_from}
              onChange={(e) => updateField("price_from", e.target.value)}
              className="text-sm bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">Price Unit</Label>
            <Select value={service.price_unit} onValueChange={(v) => updateField("price_unit", v)}>
              <SelectTrigger className="text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["per sample", "per run", "per hour", "per day", "per dataset", "flat fee"].map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">Turnaround (days)</Label>
            <Input
              type="number"
              placeholder="e.g. 5"
              value={service.turnaround_days}
              onChange={(e) => updateField("turnaround_days", e.target.value)}
              className="text-sm bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BecomeProviderBanner({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("provider_banner_dismissed") === "true"
  );
  const [step, setStep] = useState(1); // 1 = org details, 2 = services
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [org, setOrg] = useState({
    institution_name: "",
    institution_type: "",
    contact_name: "",
    accreditations: "",
    website: "",
    location: "",
    bio: "",
  });

  const [services, setServices] = useState([{ ...EMPTY_SERVICE }]);

  if (dismissed) return null;

  const updateOrg = (field, value) => setOrg((o) => ({ ...o, [field]: value }));

  const updateService = (index, updated) => {
    setServices((s) => s.map((item, i) => (i === index ? updated : item)));
  };
  const addService = () => setServices((s) => [...s, { ...EMPTY_SERVICE, subtypes: [""] }]);
  const removeService = (index) => setServices((s) => s.filter((_, i) => i !== index));

  const orgValid = org.institution_name && org.institution_type && org.contact_name;
  const servicesValid = services.every((s) => s.service_name && s.category && s.service_type && s.description && s.price_from);

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.ProviderApplication.create({
      user_email: userEmail,
      desired_services: JSON.stringify(services),
      qualifications: JSON.stringify(org),
      status: "pending",
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setDismissed(true);
      localStorage.setItem("provider_banner_dismissed", "true");
    }, 2500);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Become a Service Provider</DialogTitle>
            {!submitted && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2].map((s) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-[#000021]" : "bg-gray-200"}`} />
                ))}
                <span className="text-xs text-gray-400 ml-2">{step}/2</span>
              </div>
            )}
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-base font-semibold text-gray-800">Application submitted!</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Our team will review your services and get back to you within 2–3 business days.</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5 py-2">
              <SectionHeading number="1" title="About Your Organisation" subtitle="This helps researchers understand who you are and builds trust." />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Institution / Lab Name <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. Sydney Bioscience Core Facility"
                    value={org.institution_name}
                    onChange={(e) => updateOrg("institution_name", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Institution Type <span className="text-red-400">*</span></Label>
                  <Select value={org.institution_type} onValueChange={(v) => updateOrg("institution_type", v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["University Core Facility", "CRO (Contract Research Organisation)", "Hospital / Clinical Lab", "Biotech Company", "Government Research Institute", "Independent Lab"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Primary Contact Name <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. Dr. Sarah Chen"
                    value={org.contact_name}
                    onChange={(e) => updateOrg("contact_name", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Location / City</Label>
                  <Input
                    placeholder="e.g. Sydney, Australia"
                    value={org.location}
                    onChange={(e) => updateOrg("location", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Accreditations & Certifications</Label>
                <Input
                  placeholder="e.g. ISO 9001, GLP certified, NATA accredited"
                  value={org.accreditations}
                  onChange={(e) => updateOrg("accreditations", e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Website (optional)</Label>
                <Input
                  placeholder="https://"
                  value={org.website}
                  onChange={(e) => updateOrg("website", e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Brief Bio / About Your Lab</Label>
                <Textarea
                  placeholder="Describe your lab's research focus, expertise, and the types of researchers you typically work with..."
                  className="text-sm"
                  rows={3}
                  value={org.bio}
                  onChange={(e) => updateOrg("bio", e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  className="bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90"
                  disabled={!orgValid}
                  onClick={() => setStep(2)}
                >
                  Next: Add Services <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <SectionHeading number="2" title="Your Services" subtitle="List each service individually — be specific so researchers can find exactly what they need." />

              <div className="space-y-4">
                {services.map((service, i) => (
                  <ServiceItem
                    key={i}
                    service={service}
                    index={i}
                    onChange={updateService}
                    onRemove={removeService}
                    showRemove={services.length > 1}
                  />
                ))}
              </div>

              <button
                onClick={addService}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Another Service
              </button>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="bg-[#000021] text-[#00F2FF] hover:bg-[#000021]/90"
                  disabled={!servicesValid || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}