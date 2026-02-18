import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Store, CheckCircle2, Loader2, X } from "lucide-react";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  validated: "bg-emerald-50 text-emerald-600",
  tokenised: "bg-violet-50 text-violet-600",
  published: "bg-blue-50 text-blue-600",
};

const componentTypes = [
  { label: "Hypotheses", icon: "💡", entity: "Hypothesis", key: "hypotheses" },
  { label: "Cohorts", icon: "🧬", entity: "Cohort", key: "cohorts" },
  { label: "Workflows", icon: "⚙️", entity: "Workflow", key: "workflows" },
  { label: "Documents", icon: "📁", entity: "ProjectDocument", key: "documents" },
];

function ComponentSection({ icon, label, items, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{icon} {label}</p>
        <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{icon} {label}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
          >
            <div>
              <p className="text-xs font-medium text-gray-800">{item.title || item.name}</p>
              {item.description && (
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
              )}
            </div>
            {item.status && (
              <Badge
                variant="secondary"
                className={`text-[10px] uppercase ml-3 flex-shrink-0 ${statusStyles[item.status] || statusStyles.draft}`}
              >
                {item.status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssetDetailModal({ asset, project, open, onClose }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const { data: hypotheses = [], isLoading: loadingH } = useQuery({
    queryKey: ["detail-hypotheses", project?.id],
    queryFn: () => base44.entities.Hypothesis.filter({ project_id: project.id }),
    enabled: !!project?.id && open,
  });

  const { data: cohorts = [], isLoading: loadingC } = useQuery({
    queryKey: ["detail-cohorts", project?.id],
    queryFn: () => base44.entities.Cohort.filter({ project_id: project.id }),
    enabled: !!project?.id && open,
  });

  const { data: workflows = [], isLoading: loadingW } = useQuery({
    queryKey: ["detail-workflows", project?.id],
    queryFn: () => base44.entities.Workflow.filter({ project_id: project.id }),
    enabled: !!project?.id && open,
  });

  const { data: documents = [], isLoading: loadingD } = useQuery({
    queryKey: ["detail-docs", project?.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project.id }),
    enabled: !!project?.id && open,
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      base44.entities.Asset.update(asset.id, {
        status: "published",
        tokenisation: { ...asset.tokenisation, published_to_marketplace: true },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assets", project.id] });
      setSubmitted(true);
    },
  });

  if (!asset) return null;

  const hasComponents =
    hypotheses.length > 0 || cohorts.length > 0 || workflows.length > 0 || documents.length > 0;

  const isPublished = asset.status === "published" || submitted;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {asset.type === "publication" ? "📄" : asset.type === "validation_report" ? "🛡️" : "📦"}
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">{asset.title}</DialogTitle>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{asset.type?.replace(/_/g, " ")}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Status + description */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-[10px] uppercase ${statusStyles[isPublished ? "published" : asset.status] || statusStyles.draft}`}
            >
              {isPublished ? "published" : asset.status || "draft"}
            </Badge>
          </div>

          {asset.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>
          )}

          {/* Components */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Research Components
            </p>
            {!hasComponents && !loadingH && !loadingC && !loadingW && !loadingD ? (
              <p className="text-xs text-gray-400 italic py-4 text-center bg-gray-50 rounded-lg">
                No linked components found for this project.
              </p>
            ) : (
              <div className="space-y-4">
                <ComponentSection icon="💡" label="Hypotheses" items={hypotheses} isLoading={loadingH} />
                <ComponentSection icon="🧬" label="Cohorts" items={cohorts} isLoading={loadingC} />
                <ComponentSection icon="⚙️" label="Workflows" items={workflows} isLoading={loadingW} />
                <ComponentSection icon="📁" label="Documents" items={documents} isLoading={loadingD} />
              </div>
            )}
          </div>

          {/* Marketplace CTA */}
          <div className="border-t border-gray-100 pt-4">
            {isPublished ? (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Submitted to IP Marketplace</p>
                  <p className="text-xs text-emerald-600">This asset is now listed and discoverable.</p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-violet-500" />
                    IP Marketplace
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Publish this asset to make it discoverable and enable licensing.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-xs flex-shrink-0"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Store className="w-3.5 h-3.5 mr-1.5" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}