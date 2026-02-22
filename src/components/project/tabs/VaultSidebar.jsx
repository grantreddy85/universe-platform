import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Database, Lock, Users, Globe, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const VAULT_COLORS = ["blue", "violet", "emerald", "amber", "rose", "cyan"];

const sensitivityConfig = {
  private: { icon: Lock, label: "Private", color: "text-rose-500" },
  collaborators: { icon: Users, label: "Team", color: "text-amber-500" },
  public: { icon: Globe, label: "Public", color: "text-emerald-500" },
};

const colorMap = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const dotMap = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
};

export default function VaultSidebar({ projectId, vaults, selectedVaultId, onSelect, docCounts }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vault.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults", projectId] });
      setAdding(false);
      setName("");
      setColor("blue");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vault.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vaults", projectId] }),
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({ project_id: projectId, name: name.trim(), color, sensitivity: "private" });
  };

  return (
    <div className="w-52 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vaults</span>
        <button
          onClick={() => setAdding(true)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="New vault"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        {/* Default "All" option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedVaultId === null
              ? "bg-white border border-gray-200 text-gray-900 font-medium shadow-sm"
              : "text-gray-600 hover:bg-white hover:text-gray-900"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="flex-1 text-left text-xs truncate">All Documents</span>
          <span className="text-[10px] text-gray-400">{Object.values(docCounts).reduce((a, b) => a + b, 0)}</span>
        </button>

        {vaults.map((vault) => {
          const isSelected = selectedVaultId === vault.id;
          return (
            <div key={vault.id} className="group relative">
              <button
                onClick={() => onSelect(vault.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-white border border-gray-200 text-gray-900 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotMap[vault.color] || dotMap.blue}`} />
                <span className="flex-1 text-left text-xs truncate">{vault.name}</span>
                <span className="text-[10px] text-gray-400">{docCounts[vault.id] || 0}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(vault.id); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New vault form */}
        {adding && (
          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vault name..."
              className="h-7 text-xs"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setAdding(false); }}
            />
            <div className="flex gap-1.5">
              {VAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full ${dotMap[c]} ${color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700 flex-1" onClick={handleCreate} disabled={createMutation.isPending || !name.trim()}>
                Create
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}