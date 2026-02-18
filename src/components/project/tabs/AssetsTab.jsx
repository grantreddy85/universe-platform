import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Box, MoreHorizontal, Trash2, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InfographicModal from "./InfographicModal";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  validated: "bg-emerald-50 text-emerald-600",
  tokenised: "bg-violet-50 text-violet-600",
  published: "bg-blue-50 text-blue-600",
};

const typeIcons = {
  hypothesis: "💡",
  cohort: "🧬",
  dataset: "📊",
  workflow_result: "⚙️",
  validation_report: "🛡️",
  publication: "📄",
};

export default function AssetsTab({ project }) {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "hypothesis", description: "" });
  const [infographicAsset, setInfographicAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["project-assets", project.id],
    queryFn: () => base44.entities.Asset.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Asset.create({ ...data, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assets", project.id] });
      setShowNew(false);
      setForm({ title: "", type: "hypothesis", description: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["project-assets", project.id] }),
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Assets</h2>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Asset
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-40 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Box className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No assets created yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate(createPageUrl("AssetDetail") + `?id=${asset.id}&project_id=${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcons[asset.type] || "📦"}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{asset.title}</h3>
                    <p className="text-[11px] text-gray-400 capitalize">
                      {asset.type?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(asset.type === "publication" || asset.type === "validation_report") && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setInfographicAsset(asset); }}>
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-500" />
                        Generate Infographic
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(asset.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {asset.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{asset.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] uppercase ${statusStyles[asset.status] || statusStyles.draft}`}
                >
                  {asset.status || "draft"}
                </Badge>
                {asset.attribution?.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Users className="w-3 h-3" />
                    {asset.attribution.length} contributor{asset.attribution.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <InfographicModal
        asset={infographicAsset}
        project={project}
        open={!!infographicAsset}
        onClose={() => setInfographicAsset(null)}
      />

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Asset</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) return;
              createMutation.mutate(form);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Asset title"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hypothesis">Hypothesis</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                  <SelectItem value="workflow_result">Workflow Result</SelectItem>
                  <SelectItem value="validation_report">Validation Report</SelectItem>
                  <SelectItem value="publication">Publication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the asset..."
                className="text-sm h-20 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs"
                disabled={!form.title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}