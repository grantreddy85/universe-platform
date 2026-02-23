import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FlaskConical, MoreHorizontal, Trash2, Sparkles, Search } from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import CohortFilters from "@/components/cohorts/CohortFilters";
import StudyFinderPanel from "@/components/cohorts/StudyFinderPanel";
import CohortAssistantDialog from "@/components/cohorts/CohortAssistantDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  defined: "bg-blue-50 text-blue-600",
  queried: "bg-amber-50 text-amber-600",
  assigned: "bg-emerald-50 text-emerald-600",
};

export default function CohortsTab({ project }) {
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sampleSize, setSampleSize] = useState("");
  const [studyFinderOpen, setStudyFinderOpen] = useState(false);
  const [studyAiContext, setStudyAiContext] = useState(null);

  const handleAskAboutStudy = (study) => {
    setStudyAiContext(study);
    setAiOpen(true);
  };

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const queryClient = useQueryClient();

  const { data: cohorts = [], isLoading } = useQuery({
    queryKey: ["project-cohorts", project.id],
    queryFn: () => base44.entities.Cohort.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Cohort.create({
        ...data,
        project_id: project.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-cohorts", project.id] });
      setShowAssistant(false);
      setStudyFinderOpen(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cohort.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-cohorts", project.id] }),
  });

  return (
    <div className="flex h-full">
    <CohortFilters
      selected={activeFilters}
      onToggle={toggleFilter}
      onClear={() => setActiveFilters([])}
      sampleSize={sampleSize}
      onSampleSizeChange={setSampleSize}
    />
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Studies & Cohorts</h2>
      </div>

      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Left: Defined Cohorts */}
        <div className="col-span-1 space-y-3 max-h-96 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Defined Cohorts</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : cohorts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-200">
              <FlaskConical className="w-6 h-6 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No cohorts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="bg-white rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">{cohort.name}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-[8px] uppercase mt-1 ${statusStyles[cohort.status] || statusStyles.draft}`}
                      >
                        {cohort.status || "draft"}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 flex-shrink-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(cohort.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Study Finder */}
        <div className="col-span-1">
          <StudyFinderPanel
            activeFilters={activeFilters}
            project={project}
            onAskAboutStudy={handleAskAboutStudy}
            onClose={() => {}}
            isEmbedded={true}
          />
        </div>
      </div>

      <CohortAssistantDialog
        open={showAssistant}
        onOpenChange={setShowAssistant}
        activeFilters={activeFilters}
        onFiltersApply={(filters, size) => {
          setActiveFilters(filters);
          setSampleSize(size);
        }}
        onCohortCreated={(cohortData) => {
          createMutation.mutate(cohortData);
        }}
      />
    </div>
    {studyFinderOpen && (
      <StudyFinderPanel
        activeFilters={activeFilters}
        project={project}
        onAskAboutStudy={handleAskAboutStudy}
        onClose={() => setStudyFinderOpen(false)}
      />
    )}
    <TabAIPanel
      tabName="Cohorts"
      contextData={studyAiContext ? { cohorts, focusStudy: studyAiContext } : cohorts}
      isOpen={aiOpen}
      onToggle={() => { setAiOpen(!aiOpen); setStudyAiContext(null); }}
    />
  </div>
  );
}