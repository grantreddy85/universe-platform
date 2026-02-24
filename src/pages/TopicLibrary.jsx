import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import TopicClusterForm from "@/components/admin/TopicClusterForm";
import { AnimatePresence, motion } from "framer-motion";

const CLUSTER_COLORS = {
  "Oncology":           { bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444", text: "#991b1b" },
  "Neurodegeneration":  { bg: "#f5f3ff", border: "#c4b5fd", dot: "#8b5cf6", text: "#4c1d95" },
  "Cardiovascular":     { bg: "#fff7ed", border: "#fdba74", dot: "#f97316", text: "#7c2d12" },
  "Immunology":         { bg: "#ecfeff", border: "#67e8f9", dot: "#06b6d4", text: "#164e63" },
  "Infectious Disease": { bg: "#f0fdf4", border: "#86efac", dot: "#10b981", text: "#14532d" },
  "Rare Disease":       { bg: "#fdf4ff", border: "#f0abfc", dot: "#d946ef", text: "#701a75" },
  "Metabolic Disease":  { bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b", text: "#78350f" },
  "Respiratory":        { bg: "#eff6ff", border: "#93c5fd", dot: "#3b82f6", text: "#1e3a8a" },
  "Musculoskeletal":    { bg: "#f7fee7", border: "#bef264", dot: "#84cc16", text: "#365314" },
  "Ophthalmology":      { bg: "#eef2ff", border: "#a5b4fc", dot: "#6366f1", text: "#312e81" },
};

const DEFAULT_COLOR = { bg: "#f9fafb", border: "#e5e7eb", dot: "#6b7280", text: "#374151" };

export default function TopicLibrary() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [selectedSub, setSelectedSub] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["topic_clusters"],
    queryFn: () => base44.entities.TopicCluster.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TopicCluster.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topic_clusters"] }),
  });

  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.cluster]) acc[t.cluster] = [];
    acc[t.cluster].push(t);
    return acc;
  }, {});

  const toggle = (name) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topic Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            Therapeutic area taxonomy — click a cluster to expand sub-clusters
          </p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="bg-[#000021] text-white hover:bg-[#000021]/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Sub-cluster
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-10 max-w-7xl mx-auto">
        {[
          { label: "Clusters", value: Object.keys(grouped).length },
          { label: "Sub-clusters", value: topics.length },
          { label: "Active", value: topics.filter((t) => t.is_active !== false).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-6 py-3 flex items-center gap-3">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Flowchart tree */}
          <div className="flex flex-col items-center">
            {/* Root node */}
            <div className="bg-[#000021] text-white rounded-2xl px-8 py-3 text-sm font-semibold tracking-wide shadow-md mb-0">
              UniVerse Topic Taxonomy
            </div>

            {/* Trunk line down */}
            <div className="w-0.5 h-6 bg-gray-300" />

            {/* Horizontal bar across clusters */}
            <div className="relative w-full">
              {/* The horizontal connector line */}
              <div className="absolute top-0 left-[5%] right-[5%] h-0.5 bg-gray-300" style={{ top: 0 }} />

              {/* Cluster nodes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-0 pt-0">
                {Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([clusterName, items]) => {
                    const c = CLUSTER_COLORS[clusterName] || DEFAULT_COLOR;
                    const isOpen = !!expanded[clusterName];

                    return (
                      <div key={clusterName} className="flex flex-col items-center">
                        {/* Vertical stem up to horizontal bar */}
                        <div className="w-0.5 h-6 bg-gray-300" />

                        {/* Cluster pill */}
                        <button
                          onClick={() => toggle(clusterName)}
                          className="relative w-full rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
                          style={{
                            backgroundColor: c.bg,
                            borderColor: isOpen ? c.dot : c.border,
                          }}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
                            <span className="text-xs font-bold leading-tight" style={{ color: c.text }}>
                              {clusterName}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">{items.length} sub-clusters</div>
                          <div
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform duration-200"
                            style={{ borderColor: c.dot }}
                          >
                            {isOpen
                              ? <ChevronDown className="w-3 h-3" style={{ color: c.dot }} />
                              : <ChevronRight className="w-3 h-3" style={{ color: c.dot }} />
                            }
                          </div>
                        </button>

                        {/* Vertical line down to sub-clusters */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-full flex flex-col items-center overflow-hidden"
                            >
                              <div className="w-0.5 h-5 mt-2" style={{ backgroundColor: c.dot }} />

                              {/* Sub-cluster cards */}
                              <div className="w-full space-y-1.5">
                                {items.map((item, idx) => (
                                  <div key={item.id} className="flex flex-col items-center">
                                    {/* Connecting line except after last */}
                                    <div
                                      className="w-0.5"
                                      style={{ height: idx === 0 ? 0 : 6, backgroundColor: c.dot, opacity: 0.4 }}
                                    />
                                    <div
                                      className="w-full rounded-lg border px-2.5 py-2 cursor-pointer hover:shadow-sm transition-all group/sub relative"
                                      style={{ backgroundColor: c.bg, borderColor: c.border }}
                                      onClick={() => setSelectedSub(selectedSub?.id === item.id ? null : item)}
                                    >
                                      <p className="text-[11px] font-semibold leading-tight" style={{ color: c.text }}>
                                        {item.sub_cluster}
                                      </p>
                                      {item.is_active === false && (
                                        <span className="text-[9px] text-gray-400 italic">inactive</span>
                                      )}

                                      {/* Edit/delete on hover */}
                                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                        <button
                                          className="p-0.5 rounded hover:bg-white/70"
                                          onClick={(e) => handleEdit(item, e)}
                                        >
                                          <Pencil className="w-2.5 h-2.5 text-gray-400" />
                                        </button>
                                        <button
                                          className="p-0.5 rounded hover:bg-red-50"
                                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                                        >
                                          <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Detail panel for selected sub-cluster */}
          <AnimatePresence>
            {selectedSub && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-xl mx-auto"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{selectedSub.cluster}</p>
                    <h3 className="text-base font-bold text-gray-900">{selectedSub.sub_cluster}</h3>
                  </div>
                  <button onClick={() => setSelectedSub(null)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
                </div>
                {selectedSub.description && (
                  <p className="text-sm text-gray-500 mb-4">{selectedSub.description}</p>
                )}
                {selectedSub.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Algorithm Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSub.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="outline" onClick={(e) => handleEdit(selectedSub, e)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showForm && (
        <TopicClusterForm
          item={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["topic_clusters"] });
          }}
        />
      )}
    </div>
  );
}