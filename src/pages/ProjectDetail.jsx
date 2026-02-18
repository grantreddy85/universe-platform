import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectTabs from "../components/project/ProjectTabs";
import TabAIQuery from "../components/project/TabAIQuery";
import OverviewTab from "../components/project/tabs/OverviewTab";
import AITab from "../components/project/tabs/AITab";
import NotesTab from "../components/project/tabs/NotesTab";
import VaultTab from "../components/project/tabs/VaultTab";
import CohortsTab from "../components/project/tabs/CohortsTab";
import WorkflowsTab from "../components/project/tabs/WorkflowsTab";
import ValidationTab from "../components/project/tabs/ValidationTab";
import AssetsTab from "../components/project/tabs/AssetsTab";
import LabsTab from "../components/project/tabs/LabsTab";

export default function ProjectDetail() {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiQueryOpen, setAiQueryOpen] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

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
    <div className="min-h-screen bg-[#fafbfc]">
      <ProjectHeader project={project} />
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ActiveComponent project={project} onTabChange={setActiveTab} />
    </div>
  );
}