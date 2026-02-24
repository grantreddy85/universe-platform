import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

const CLUSTERS = [
  "Oncology",
  "Neurodegeneration",
  "Cardiovascular",
  "Immunology",
  "Infectious Disease",
  "Rare Disease",
  "Metabolic Disease",
  "Respiratory",
  "Musculoskeletal",
  "Ophthalmology",
];

export default function TopicClusterForm({ item, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    cluster: item?.cluster || "",
    sub_cluster: item?.sub_cluster || "",
    description: item?.description || "",
    keywords: item?.keywords || [],
    is_active: item?.is_active !== false,
  });
  const [kwInput, setKwInput] = useState("");

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.TopicCluster.update(item.id, data)
        : base44.entities.TopicCluster.create(data),
    onSuccess: onSaved,
  });

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
    }
    setKwInput("");
  };

  const removeKeyword = (kw) =>
    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? "Edit Sub-cluster" : "Add Sub-cluster"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Cluster */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Therapeutic Area (Cluster)</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.cluster}
              onChange={(e) => setForm((f) => ({ ...f, cluster: e.target.value }))}
            >
              <option value="">Select cluster…</option>
              {CLUSTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sub-cluster */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sub-cluster Name</label>
            <Input
              placeholder="e.g. Alzheimer's Disease"
              value={form.sub_cluster}
              onChange={(e) => setForm((f) => ({ ...f, sub_cluster: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              placeholder="Brief description of the research scope…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Keywords (for algorithm weighting)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword…"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button variant="outline" size="sm" onClick={addKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Active (available for asset assignment)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#000021] text-white hover:bg-[#000021]/90"
            disabled={!form.cluster || !form.sub_cluster || saveMutation.isPending}
            onClick={() => saveMutation.mutate(form)}
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Sub-cluster"}
          </Button>
        </div>
      </div>
    </div>
  );
}