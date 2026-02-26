import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import CohortFilters from "@/components/cohorts/CohortFilters";
import CohortAssistantDialog from "@/components/cohorts/CohortAssistantDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [studyAiContext, setStudyAiContext] = useState(null);

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
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Cohorts</h2>
          <Button onClick={() => setShowAssistant(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Create New Cohort
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading cohorts...</div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No cohorts created yet. Click "Create New Cohort" to get started.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="bg-white rounded-xl border border-gray-100 p-4 relative group hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{cohort.name}</h3>
                  <Badge className={`${statusStyles[cohort.status]} text-xs`}>
                    {cohort.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Sample Size: {cohort.sample_size}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {cohort.filters?.slice(0, 3).map((filter, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs text-gray-500">
                      {typeof filter === 'object' ? filter.field : filter}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Created: {new Date(cohort.created_date).toLocaleDateString()}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteMutation.mutate(cohort.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

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