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
  const [showCohortsDropdown, setShowCohortsDropdown] = useState(false);

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
    <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
      {/* Your Cohorts Section */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => setShowCohortsDropdown(!showCohortsDropdown)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Your Cohorts ({cohorts.length})</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showCohortsDropdown ? "rotate-180" : ""}`} />
        </button>
        
        {showCohortsDropdown && cohorts.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
            {cohorts.map((cohort) => (
              <button
                key={cohort.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all text-left truncate"
              >
                <span className="truncate">{cohort.name}</span>
                <Badge className={`${statusStyles[cohort.status]} text-xs flex-shrink-0`}>
                  {cohort.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <CohortFilters
        selected={activeFilters}
        onToggle={toggleFilter}
        onClear={() => setActiveFilters([])}
        sampleSize={sampleSize}
        onSampleSizeChange={setSampleSize}
      />
    </div>
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
        project={project}
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
      project={project}
      availableFilters={`Age, Sex, Region, Organism, Data Type, Omics Layer, Library Strategy, Library Source, Platform, Phenotype/Disease`}
      isOpen={true}
      onToggle={() => { setAiOpen(!aiOpen); setStudyAiContext(null); }}
      onRecommendCohort={() => setShowAssistant(true)}
      onSetFilters={(filters) => {
        setActiveFilters(filters);
      }}
      onCreateCohort={(cohortData) => {
        createMutation.mutate(cohortData);
      }}
    />
  </div>
  );
}