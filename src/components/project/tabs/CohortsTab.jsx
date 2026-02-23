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

      {/* Study Finder */}
      <StudyFinderPanel
        activeFilters={activeFilters}
        project={project}
        onAskAboutStudy={handleAskAboutStudy}
        onClose={() => {}}
        isEmbedded={true}
      />

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
    <TabAIPanel
      tabName="Cohorts"
      contextData={studyAiContext ? { cohorts, focusStudy: studyAiContext } : cohorts}
      isOpen={true}
      onToggle={() => { setAiOpen(!aiOpen); setStudyAiContext(null); }}
      onRecommendCohort={() => setShowAssistant(true)}
    />
  </div>
  );
}