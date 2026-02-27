import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FlaskConical, MoreHorizontal, Trash2, Sparkles, Search, Users, ChevronRight, Tag, X } from "lucide-react";
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
  const [cohortName, setCohortName] = useState("");
  const [selectedCohort, setSelectedCohort] = useState(null);

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

  const { data: hypotheses = [] } = useQuery({
    queryKey: ["project-hypotheses", project.id],
    queryFn: () => base44.entities.Hypothesis.filter({ project_id: project.id }, "-created_date", 50),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["project-notes-cohorts", project.id],
    queryFn: () => base44.entities.Note.filter({ project_id: project.id }, "-created_date", 50),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["project-documents-cohorts", project.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project.id }, "-created_date", 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Cohort.create({
        ...data,
        project_id: project.id,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["project-cohorts", project.id] });
      setShowAssistant(false);
      setStudyFinderOpen(true);
      setCohortName(created.name || "");
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
        project={project}
        onFiltersApply={(filters, size) => {
          setActiveFilters(filters);
          setSampleSize(size);
        }}
        onCohortNameChange={(name) => setCohortName(name)}
        onCohortCreated={(cohortData) => {
          createMutation.mutate(cohortData);
        }}
      />
    </div>
    <TabAIPanel
      tabName="Cohorts"
      contextData={studyAiContext ? { cohorts, focusStudy: studyAiContext, activeFilters, sampleSize, currentCohortName: cohortName } : { cohorts, activeFilters, sampleSize, currentCohortName: cohortName }}
      project={project}
      hypotheses={hypotheses}
      notes={notes}
      documents={documents}
      availableFilters={`Age, Sex, Region, Organism, Data Type, Omics Layer, Library Strategy, Library Source, Platform, Phenotype/Disease`}
      isOpen={true}
      onToggle={() => { setAiOpen(!aiOpen); setStudyAiContext(null); }}
      onRecommendCohort={() => setShowAssistant(true)}
      onSetFilters={(filters) => {
        const FILTER_GROUPS = [
          { key: "age", options: ["<1 Mo", "1 Mo–1 Yr", "1–5 Yr", "5–10 Yr", "10–15 Yr", "15–30 Yr", "30–45 Yr", "45–60 Yr", "60–70 Yr", "70–80 Yr", "80+ Yr"] },
          { key: "sex", options: ["Female", "Male", "Other", "Mixed/Pooled"] },
          { key: "region", options: ["North America", "South America", "Western Europe", "Eastern Europe", "Sub-Saharan Africa", "North Africa", "Middle East", "South Asia", "East Asia", "Southeast Asia", "Oceania", "Central Asia", "Han Chinese", "European", "African", "South Asian", "Hispanic/Latino", "Ashkenazi Jewish", "Indigenous / Aboriginal", "Mixed / Admixed"] },
          { key: "organism", options: ["Homo Sapiens", "Mus Musculus", "Rattus Norvegicus", "Danio Rerio", "Drosophila Melanogaster", "Caenorhabditis Elegans", "Saccharomyces Cerevisiae", "Staphylococcus Aureus", "Escherichia Coli", "Human Gut Metagenome", "Canis Lupus Familiaris"] },
          { key: "data_type", options: ["Raw Sequence Reads", "Transcriptome / Gene Expression", "Genome Sequencing & Assembly", "Epigenomics", "Targeted Locus/Loci", "Metagenome", "Variation / SNP", "Exome", "Proteomics – Mass Spectrometry", "Proteomics – Antibody-based", "Lipidomics", "Metabolomics", "Glycomics", "Multi-omics"] },
          { key: "omics_layer", options: ["Genomics", "Transcriptomics", "Epigenomics", "Proteomics", "Phosphoproteomics", "Ubiquitinomics", "Lipidomics", "Metabolomics", "Glycomics", "Single-cell Multi-omics", "Spatial Omics", "Metagenomics", "Metatranscriptomics"] },
          { key: "library_strategy", options: ["WGS", "WXS", "RNA-Seq", "scRNA-Seq", "ATAC-Seq", "ChIP-Seq", "Bisulfite-Seq", "miRNA-Seq", "Amplicon", "Targeted Capture", "Other"] },
          { key: "library_source", options: ["Genomic", "Transcriptomic", "Transcriptomic Single Cell", "Metagenomic", "Metatranscriptomic", "Synthetic", "Genomic Single Cell"] },
          { key: "platform", options: ["Illumina", "Oxford Nanopore", "PacBio SMRT", "Ion Torrent", "BGIseq / DNBseq", "10x Genomics", "Agilent", "Bruker (MS)", "Thermo Fisher (MS)", "AB Sciex", "Waters", "LS454", "Capillary"] },
          { key: "phenotype", options: ["Healthy Control", "Cancer", "Neurodegenerative", "Cardiovascular", "Diabetes / Metabolic", "Infectious Disease", "Autoimmune", "Rare / Genetic Disorder", "Respiratory", "Psychiatric"] },
        ];

        const normalized = filters.map((f) => {
          const colonIdx = f.indexOf(":");
          if (colonIdx === -1) return f;
          const aiKey = f.slice(0, colonIdx).trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
          const aiVal = f.slice(colonIdx + 1).trim().toLowerCase();

          // Find matching group by key similarity
          const group = FILTER_GROUPS.find((g) => {
            const gk = g.key.toLowerCase();
            return gk === aiKey || aiKey.includes(gk) || gk.includes(aiKey);
          });
          if (!group) return f;

          // Find best matching option by comparing lowercased values
          const match = group.options.find((opt) =>
            opt.toLowerCase() === aiVal ||
            opt.toLowerCase().replace(/[^a-z0-9]/g, "") === aiVal.replace(/[^a-z0-9]/g, "")
          );
          return match ? `${group.key}:${match}` : `${group.key}:${f.slice(colonIdx + 1).trim()}`;
        });

        setActiveFilters(normalized);
      }}
      onCreateCohort={(cohortData) => {
        createMutation.mutate(cohortData);
      }}
    />
  </div>
  );
}