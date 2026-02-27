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

  // Listen for "Save Cohort" event from StudyFinderPanel
  React.useEffect(() => {
    const handler = (e) => {
      const filters = e.detail?.activeFilters || [];
      createMutation.mutate({
        name: "Cohort from Filters",
        filters: filters.map((f) => {
          const [field, value] = f.split(":");
          return { field, value, operator: "is" };
        }),
        sample_size: sampleSize ? parseInt(sampleSize) : null,
        status: "defined",
      });
    };
    window.addEventListener("save_cohort_from_filters", handler);
    return () => window.removeEventListener("save_cohort_from_filters", handler);
  }, [sampleSize]);

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

      {/* Saved Cohorts */}
      {cohorts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Saved Cohorts ({cohorts.length})</h3>
          <div className="grid gap-2">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                onClick={() => setSelectedCohort(selectedCohort?.id === cohort.id ? null : cohort)}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{cohort.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusStyles[cohort.status] || statusStyles.draft}`}>
                        {cohort.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cohort.filters?.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {f.field}: {f.value}
                        </span>
                      ))}
                      {cohort.filters?.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{cohort.filters.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {cohort.sample_size && (
                    <span className="text-xs text-gray-400">n={cohort.sample_size}</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(cohort.id); }}
                    className="p-1 rounded hover:bg-red-50 hover:text-red-400 text-gray-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${selectedCohort?.id === cohort.id ? "rotate-90" : ""}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Expanded Cohort Detail */}
          {selectedCohort && (
            <div className="mt-2 p-4 rounded-lg border border-blue-200 bg-blue-50/40">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">{selectedCohort.name}</h4>
                  {selectedCohort.organism && <p className="text-xs text-gray-500 mt-0.5">Organism: {selectedCohort.organism}</p>}
                </div>
                <button onClick={() => setSelectedCohort(null)} className="p-1 rounded hover:bg-blue-100 text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {selectedCohort.filters?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-md px-2.5 py-1.5 border border-blue-100">
                    <Tag className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 capitalize">{f.field.replace(/_/g, " ")}:</span>
                    <span className="text-xs font-medium text-gray-700">{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {selectedCohort.sample_size && <span>Target sample: <strong>{selectedCohort.sample_size}</strong></span>}
                {selectedCohort.linked_hypothesis_id && <span>Linked to hypothesis</span>}
                <span className={`px-2 py-0.5 rounded-full font-medium ${statusStyles[selectedCohort.status] || statusStyles.draft}`}>
                  {selectedCohort.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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