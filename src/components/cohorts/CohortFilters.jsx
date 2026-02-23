import React, { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FILTER_GROUPS = [
  {
    key: "age",
    label: "Age",
    options: ["<1 Mo", "1 Mo–1 Yr", "1–5 Yr", "5–10 Yr", "10–15 Yr", "15–30 Yr", "30–45 Yr", "45–60 Yr", "60–70 Yr", "70–80 Yr", "80+ Yr"],
  },
  {
    key: "sex",
    label: "Sex",
    options: ["Female", "Male", "Other", "Mixed/Pooled"],
  },
  {
    key: "region",
    label: "Region / Nationality",
    options: [
      "North America", "South America", "Western Europe", "Eastern Europe",
      "Sub-Saharan Africa", "North Africa", "Middle East", "South Asia",
      "East Asia", "Southeast Asia", "Oceania", "Central Asia",
      "Han Chinese", "European", "African", "South Asian", "Hispanic/Latino",
      "Ashkenazi Jewish", "Indigenous / Aboriginal", "Mixed / Admixed",
    ],
  },
  {
    key: "organism",
    label: "Organism",
    options: [
      "Homo Sapiens", "Mus Musculus", "Rattus Norvegicus", "Danio Rerio",
      "Drosophila Melanogaster", "Caenorhabditis Elegans", "Saccharomyces Cerevisiae",
      "Staphylococcus Aureus", "Escherichia Coli", "Human Gut Metagenome",
      "Canis Lupus Familiaris",
    ],
  },
  {
    key: "data_type",
    label: "Data Type",
    options: [
      "Raw Sequence Reads", "Transcriptome / Gene Expression", "Genome Sequencing & Assembly",
      "Epigenomics", "Targeted Locus/Loci", "Metagenome", "Variation / SNP", "Exome",
      "Proteomics – Mass Spectrometry", "Proteomics – Antibody-based",
      "Lipidomics", "Metabolomics", "Glycomics", "Multi-omics",
    ],
  },
  {
    key: "omics_layer",
    label: "Omics Layer",
    options: [
      "Genomics", "Transcriptomics", "Epigenomics",
      "Proteomics", "Phosphoproteomics", "Ubiquitinomics",
      "Lipidomics", "Metabolomics", "Glycomics",
      "Single-cell Multi-omics", "Spatial Omics", "Metagenomics", "Metatranscriptomics",
    ],
  },
  {
    key: "library_strategy",
    label: "Library Strategy",
    options: [
      "WGS", "WXS", "RNA-Seq", "scRNA-Seq", "ATAC-Seq", "ChIP-Seq",
      "Bisulfite-Seq", "miRNA-Seq", "Amplicon", "Targeted Capture", "Other",
    ],
  },
  {
    key: "library_source",
    label: "Library Source",
    options: [
      "Genomic", "Transcriptomic", "Transcriptomic Single Cell",
      "Metagenomic", "Metatranscriptomic", "Synthetic", "Genomic Single Cell",
    ],
  },
  {
    key: "platform",
    label: "Platform / Vendor",
    options: [
      "Illumina", "Oxford Nanopore", "PacBio SMRT", "Ion Torrent",
      "BGIseq / DNBseq", "10x Genomics", "Agilent", "Bruker (MS)",
      "Thermo Fisher (MS)", "AB Sciex", "Waters", "LS454", "Capillary",
    ],
  },
  {
    key: "phenotype",
    label: "Phenotype / Disease",
    options: [
      "Healthy Control", "Cancer", "Neurodegenerative", "Cardiovascular",
      "Diabetes / Metabolic", "Infectious Disease", "Autoimmune",
      "Rare / Genetic Disorder", "Respiratory", "Psychiatric",
    ],
  },
];

function FilterGroup({ group, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const selectedInGroup = selected.filter((s) => s.startsWith(group.key + ":"));

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          {group.label}
          {selectedInGroup.length > 0 && (
            <Badge className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0 h-4">
              {selectedInGroup.length}
            </Badge>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {group.options.map((opt) => {
            const key = `${group.key}:${opt}`;
            const active = selected.includes(key);
            return (
              <button
                key={opt}
                onClick={() => onToggle(key)}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CohortFilters({ selected, onToggle, onClear }) {
  return (
    <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
        {selected.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>
      {FILTER_GROUPS.map((group) => (
        <FilterGroup key={group.key} group={group} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  );
}