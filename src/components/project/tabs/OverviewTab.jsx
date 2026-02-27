import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Users,
  TrendingUp,
  Clock,
  GitBranch,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ResearchProgress from "../ResearchProgress";
import ProjectIntelligence from "../ProjectIntelligence";

export default function OverviewTab({ project, onTabChange }) {
  const { data: notes = [] } = useQuery({
    queryKey: ["project-notes", project.id],
    queryFn: () => base44.entities.Note.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () =>
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["project-assets", project.id],
    queryFn: () => base44.entities.Asset.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: hypotheses = [] } = useQuery({
    queryKey: ["project-hypotheses", project.id],
    queryFn: () => base44.entities.Hypothesis.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ["project-workflows", project.id],
    queryFn: () => base44.entities.Workflow.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["project-labrequests", project.id],
    queryFn: () => base44.entities.LabRequest.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: vaultDocs = [] } = useQuery({
    queryKey: ["project-docs", project.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ["project-cohorts", project.id],
    queryFn: () => base44.entities.Cohort.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["project-activities", project.id],
    queryFn: () =>
      base44.entities.Activity.filter({ project_id: project.id }, "-created_date", 10),
  });



  const statusColors = {
    draft: "bg-gray-100 text-gray-600",
    active: "bg-blue-50 text-blue-600",
    validation: "bg-yellow-50 text-yellow-600",
    validated: "bg-green-50 text-green-600",
    tokenised: "bg-purple-50 text-purple-600",
  };

  const validatedAssets = assets.filter((a) => a.status === "validated" || a.status === "tokenised");
  const pendingValidations = validations.filter((v) => v.status === "pending" || v.status === "in_review");
  const tokenisedAssets = assets.filter((a) => a.tokenisation?.is_tokenised);

  // Workflow nudge: recommend if cohort or hypothesis exists but no workflow yet
  const hasCohortsOrHypotheses = hypotheses.length > 0;
  const shouldNudgeWorkflow = hasCohortsOrHypotheses && workflows.length === 0;

  return (
    <div className="p-6 lg:p-8 flex gap-6 items-start">
    <div className="flex-1 min-w-0 space-y-6">
      {/* Research Progress Guidance */}
      <ResearchProgress
        counts={{ notes, hypotheses, workflows, labRequests, validations, assets, vaultDocs }}
        onTabChange={onTabChange}
      />

      {/* Workflow nudge */}
      {shouldNudgeWorkflow && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-violet-900">Ready to model your hypothesis?</p>
            <p className="text-xs text-violet-600 mt-0.5">
              You have {hypotheses.length > 1 ? `${hypotheses.length} hypotheses` : "a hypothesis"} ready — a computational workflow could help test {hypotheses.length > 1 ? "them" : "it"} before lab validation.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-violet-200 text-violet-700 hover:bg-violet-100 flex-shrink-0 gap-1.5"
            onClick={() => onTabChange("workflows")}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Add Workflow
          </Button>
        </div>
      )}

      {/* Project Status Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Project Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-2">Current Stage</p>
            <Badge className={`${statusColors[project.status]} text-xs uppercase`}>
              {project.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Validation Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${project.validation_score || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {project.validation_score || 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Commercial Readiness</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${project.commercial_readiness || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {project.commercial_readiness || 0}%
              </span>
            </div>
          </div>
        </div>
        {project.collaborators && project.collaborators.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Collaborators
            </p>
            <div className="flex flex-wrap gap-2">
              {project.collaborators.map((email, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md"
                >
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Publication Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Publication Progress
        </h3>
        <div className="space-y-3">
          <ProgressItem
            label="Research & Notes"
            value={notes.length}
            total={10}
            description="AI-generated and manual notes captured"
          />
          <ProgressItem
            label="Validations Completed"
            value={validations.filter((v) => v.status === "approved").length}
            total={validations.length || 1}
            description="Validated findings ready for publication"
          />
          <ProgressItem
            label="Assets Created"
            value={validatedAssets.length}
            total={assets.length || 1}
            description="Validated assets for publication"
          />
          <ProgressItem
            label="Tokenised"
            value={tokenisedAssets.length}
            total={assets.length || 1}
            description="Assets tokenised and ready for marketplace"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Recent Activity
        </h3>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {activity.entity_type}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {activity.created_date &&
                        format(new Date(activity.created_date), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Project Intelligence Sidebar */}
    <div className="w-80 flex-shrink-0 h-[700px]">
      <ProjectIntelligence
        project={project}
        notes={notes}
        documents={vaultDocs}
        hypotheses={hypotheses}
        cohorts={cohorts}
        workflows={workflows}
      />
    </div>
    </div>
  );
}


function ProgressItem({ label, value, total, description }) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {value} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{description}</p>
    </div>
  );
}