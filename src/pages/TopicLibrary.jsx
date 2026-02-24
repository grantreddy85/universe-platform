import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X, Check } from "lucide-react";
import TopicClusterForm from "@/components/admin/TopicClusterForm";

const CLUSTER_COLORS = {
  "Oncology": "#ef4444",
  "Neurodegeneration": "#8b5cf6",
  "Cardiovascular": "#f97316",
  "Immunology": "#06b6d4",
  "Infectious Disease": "#10b981",
  "Rare Disease": "#ec4899",
  "Metabolic Disease": "#f59e0b",
  "Respiratory": "#3b82f6",
  "Musculoskeletal": "#84cc16",
  "Ophthalmology": "#6366f1",
};

export default function TopicLibrary() {
  const queryClient = useQueryClient();
  const [expandedClusters, setExpandedClusters] = useState({});
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

  // Group by cluster
  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.cluster]) acc[t.cluster] = [];
    acc[t.cluster].push(t);
    return acc;
  }, {});

  const toggleCluster = (name) =>
    setExpandedClusters((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topic Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage therapeutic area clusters and sub-clusters used for asset weighting
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-[#000021] text-white hover:bg-[#000021]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Sub-cluster
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Clusters</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(grouped).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Sub-clusters</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{topics.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{topics.filter((t) => t.is_active !== false).length}</p>
        </div>
      </div>

      {/* Cluster list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400 text-sm mb-4">No topic clusters yet.</p>
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add your first cluster
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([clusterName, items]) => {
            const color = CLUSTER_COLORS[clusterName] || "#6b7280";
            const isOpen = expandedClusters[clusterName] !== false; // open by default
            return (
              <div key={clusterName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Cluster header */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleCluster(clusterName)}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-gray-900 flex-1">{clusterName}</span>
                  <Badge variant="secondary" className="text-xs">{items.length} sub-cluster{items.length !== 1 ? "s" : ""}</Badge>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Sub-clusters */}
                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 group">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800">{item.sub_cluster}</p>
                            {item.is_active === false && (
                              <Badge variant="outline" className="text-[10px] text-gray-400">Inactive</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                          )}
                          {item.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.keywords.map((kw, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
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