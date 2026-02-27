import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectTabs from "../components/project/ProjectTabs";
import OverviewTab from "../components/project/tabs/OverviewTab";
import AITab from "../components/project/tabs/AITab";
import NotesTab from "../components/project/tabs/NotesTab";
import VaultTab from "../components/project/tabs/VaultTab";
import CohortsTab from "../components/project/tabs/CohortsTab";
import WorkflowsTab from "@/components/project/tabs/WorkflowsTab.jsx";
import ValidationTab from "../components/project/tabs/ValidationTab";
import AssetsTab from "../components/project/tabs/AssetsTab";
import LabsTab from "../components/project/tabs/LabsTab";

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");
  const initialTab = urlParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const scrollRef = React.useRef(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["project-notes", projectId],
    queryFn: () => base44.entities.Note.filter({ project_id: projectId }, "-created_date", 100),
    enabled: !!projectId,
  });
  const { data: validations = [] } = useQuery({
    queryKey: ["project-validations", projectId],
    queryFn: () => base44.entities.ValidationRequest.filter({ project_id: projectId }, "-created_date", 100),
    enabled: !!projectId,
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["project-assets", projectId],
    queryFn: () => base44.entities.Asset.filter({ project_id: projectId }, "-created_date", 100),
    enabled: !!projectId,
  });
  const { data: cohorts = [] } = useQuery({
    queryKey: ["project-cohorts-count", projectId],
    queryFn: () => base44.entities.Cohort.filter({ project_id: projectId }, "-created_date", 100),
    enabled: !!projectId,
  });

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const tabCounts = {
    notes: notes.length || null,
    validation: validations.length || null,
    assets: assets.length || null,
    cohorts: cohorts.length || null,
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  const tabComponents = {
    overview: OverviewTab,
    ai: AITab,
    notes: NotesTab,
    vault: VaultTab,
    cohorts: CohortsTab,
    workflows: WorkflowsTab,
    validation: ValidationTab,
    assets: AssetsTab,
    labs: LabsTab,
  };

  const ActiveComponent = tabComponents[activeTab] || OverviewTab;

  return (
    <div className="flex flex-col h-screen bg-[#fafbfc] overflow-hidden">
      <ProjectHeader project={project} />
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} tabCounts={tabCounts} />
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <ActiveComponent project={project} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}