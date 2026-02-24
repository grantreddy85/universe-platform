import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FlaskConical, FileText, CheckCircle } from "lucide-react";

export default function LabRequestDialog({ service, open, onClose }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [requestType, setRequestType] = useState("data_upload");
  const [paymentPreference, setPaymentPreference] = useState("cash");
  const [equityPercentage, setEquityPercentage] = useState(10);
  const [form, setForm] = useState({ title: "", description: "", sample_details: "", project_id: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects_for_lab"],
    queryFn: () => base44.entities.Project.list(),
  });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    setUploading(true);
    let data_file_url = null;

    if (requestType === "data_upload" && file) {
      const res = await base44.integrations.Core.UploadFile({ file });
      data_file_url = res.file_url;
    }

    await base44.entities.LabRequest.create({
      service_id: service.id,
      project_id: form.project_id || null,
      requester_email: user?.email,
      title: form.title,
      description: form.description,
      request_type: requestType,
      data_file_url,
      sample_details: form.sample_details,
      payment_preference: paymentPreference,
      equity_percentage: paymentPreference === "equity_share" ? equityPercentage : null,
      status: "pending",
    });

    setUploading(false);
    setStep(2);
  };

  const isValid = form.title && form.description;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="w-4 h-4 text-teal-500" />
            Request: {service.name}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 mt-1">
            {/* Request type toggle */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Request Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "data_upload", label: "Upload Data", icon: FileText, desc: "Submit a data file for analysis" },
                  { value: "sample_submission", label: "Send Sample", icon: FlaskConical, desc: "Ship a physical sample to the lab" },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRequestType(opt.value)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all ${
                        requestType === opt.value
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${requestType === opt.value ? "text-blue-500" : "text-gray-400"}`} />
                      <div className={`font-medium ${requestType === opt.value ? "text-blue-700" : "text-gray-700"}`}>{opt.label}</div>
                      <div className="text-gray-400 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Experiment / Request Title</Label>
              <Input
                placeholder="e.g. Protein expression analysis – sample batch 3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Description & Instructions</Label>
              <Textarea
                placeholder="Describe what you need analysed, any specific parameters, and expected outputs..."
                className="text-sm min-h-[90px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Conditional fields */}
            {requestType === "data_upload" ? (
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Upload Data File</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  <Upload className="w-5 h-5 text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">
                    {file ? file.name : "Click to upload (CSV, PDF, XLSX, images)"}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Sample Details</Label>
                <Textarea
                  placeholder="Describe the sample: type, quantity, storage conditions, shipping requirements..."
                  className="text-sm min-h-[70px]"
                  value={form.sample_details}
                  onChange={(e) => setForm({ ...form, sample_details: e.target.value })}
                />
              </div>
            )}

            {/* Link to project */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Link to Project (optional)</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              >
                <option value="">— No project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" disabled={!isValid || uploading} onClick={handleSubmit}>
                {uploading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        ) : (
          /* Success */
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Request Submitted!</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Your request has been sent to the lab operator. You'll be notified when they respond, and results will be added as an asset to your project.
            </p>
            <Button size="sm" className="mt-2" onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}