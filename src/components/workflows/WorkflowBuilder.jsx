import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Upload, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const PROTEOMICS_TEMPLATE = {
  title: "Proteomics LC-MS/MS Pipeline (Waters)",
  type: "other",
  description: "End-to-end proteomic workflow: sample prep → LC-MS/MS acquisition → database search → quantification → stats → reporting.",
  status: "draft",
  steps: [
    {
      title: "Sample Preparation",
      type: "sample_prep",
      status: "pending",
      objective: "Extract and digest proteins into peptides for mass spectrometry analysis.",
      steps: [
        "Protein Extraction: Lysis buffer, sonication, or homogenization",
        "Protein Quantification: BCA, Bradford, or Lowry assay",
        "Protein Digestion: Trypsin or other proteases for peptide generation",
        "Peptide Purification: Solid-phase extraction (SPE) or StageTips",
        "Optional Enrichment: Phosphoproteomics, glycoproteomics"
      ],
      tools: ["NanoDrop", "Qubit", "PeptideCutter (ExPASy)"],
      inputs: ["Biological sample (tissue, cells, plasma)"],
      outputs: ["Purified peptide digest"],
      parameters: { protease: "Trypsin", digestion_time: "16h at 37°C", quantification_method: "BCA" }
    },
    {
      title: "LC-MS/MS Acquisition (Waters)",
      type: "ms_acquisition",
      status: "pending",
      objective: "Separate and fragment peptides using liquid chromatography coupled to mass spectrometry.",
      steps: [
        "Load purified peptides onto reverse-phase LC column",
        "Gradient elution (water/acetonitrile + 0.1% formic acid)",
        "Data-dependent acquisition (DDA) or data-independent acquisition (DIA)",
        "MS1 survey scan → MS2 fragmentation of top N precursors",
        "Collect .raw files from Waters instrument"
      ],
      tools: ["Waters Synapt G2-Si", "Waters Xevo QTOF", "Waters Vion IMS QTOF", "MassLynx", "UNIFI"],
      inputs: ["Purified peptide digest"],
      outputs: [".raw data files", "Retention time index"],
      parameters: { instrument: "Waters Synapt G2-Si", acquisition_mode: "DDA", column: "BEH C18 1.7µm", gradient_length: "90 min" }
    },
    {
      title: "Data Processing & Peak Picking",
      type: "data_processing",
      status: "pending",
      objective: "Convert raw files, detect peaks, and deisotope spectra.",
      steps: [
        "Convert .raw files to open format (mzML/mzXML) via ProteoWizard",
        "Peak picking and centroiding",
        "Deisotoping and charge state assignment",
        "Quality control: TIC, base peak chromatogram review"
      ],
      tools: ["ProteoWizard (msConvert)", "Waters UNIFI", "MassLynx DataBridge"],
      inputs: [".raw data files"],
      outputs: ["mzML / mzXML files", "QC report"],
      parameters: { file_format: "mzML", peak_picking: "vendor", ms_levels: "1,2" }
    },
    {
      title: "Database Search & Protein Identification",
      type: "protein_identification",
      status: "pending",
      objective: "Match MS2 spectra to peptide sequences in a protein database.",
      steps: [
        "Select protein database (UniProt, SwissProt, RefSeq, or custom FASTA)",
        "Configure search parameters: enzyme, missed cleavages, variable mods",
        "Run database search engine",
        "Apply FDR filtering (typically 1% at PSM and protein level)",
        "Generate protein/peptide identification list"
      ],
      tools: ["Mascot", "MaxQuant", "Sequest (Proteome Discoverer)", "MSFragger", "Skyline"],
      inputs: ["mzML files", "FASTA protein database"],
      outputs: ["PSM list", "Protein identification table", "FDR-filtered results"],
      parameters: { enzyme: "Trypsin", missed_cleavages: 2, fdr_threshold: "1%", fixed_mod: "Carbamidomethyl (C)", variable_mods: "Oxidation (M)" }
    },
    {
      title: "Quantification",
      type: "quantification",
      status: "pending",
      objective: "Determine relative or absolute protein abundances across samples.",
      steps: [
        "Label-free quantification (LFQ) via MS1 peak intensity OR label-based (TMT/iTRAQ) reporter ion quantification",
        "Peptide-to-protein rollup (sum, mean, or iBAQ)",
        "Normalisation: median, quantile, or VSN",
        "Handle missing values: imputation or filtering"
      ],
      tools: ["MaxQuant", "Proteome Discoverer", "Progenesis QI (Waters)", "MSstats"],
      inputs: ["FDR-filtered identifications", "Raw peak areas"],
      outputs: ["Normalised protein abundance matrix"],
      parameters: { method: "Label-Free Quantification (LFQ)", normalisation: "Median", min_peptides_per_protein: 2 }
    },
    {
      title: "Statistical Analysis & Differential Expression",
      type: "statistical_analysis",
      status: "pending",
      objective: "Identify significantly changing proteins between conditions.",
      steps: [
        "Define experimental groups and contrasts",
        "Apply statistical test: t-test, limma, or MSstats model",
        "Adjust p-values for multiple testing (Benjamini-Hochberg FDR)",
        "Volcano plot and heatmap visualisation",
        "Functional enrichment: GO, KEGG, Reactome"
      ],
      tools: ["R (limma, MSstats)", "Perseus", "Python (SciPy, statsmodels)", "STRING", "g:Profiler"],
      inputs: ["Normalised protein abundance matrix", "Sample metadata"],
      outputs: ["Differential expression table", "Volcano plot", "Enrichment results"],
      parameters: { test: "limma moderated t-test", p_value_cutoff: 0.05, fold_change_cutoff: 1.5, fdr_method: "BH" }
    },
    {
      title: "Bioinformatics & Pathway Analysis",
      type: "bioinformatics",
      status: "pending",
      objective: "Contextualise results within biological pathways and networks.",
      steps: [
        "Protein-protein interaction network analysis (STRING, Cytoscape)",
        "Gene ontology (GO) term enrichment",
        "KEGG/Reactome pathway mapping",
        "Comparison with public datasets (ProteomeXchange, PRIDE)"
      ],
      tools: ["STRING", "Cytoscape", "g:Profiler", "Reactome", "PRIDE / ProteomeXchange"],
      inputs: ["Differential expression table"],
      outputs: ["Pathway enrichment report", "Network figure"],
      parameters: { network_confidence: 0.7, go_level: "biological_process" }
    },
    {
      title: "Reporting & Data Deposition",
      type: "reporting",
      status: "pending",
      objective: "Compile results into a reproducible report and deposit raw data.",
      steps: [
        "Generate PDF/HTML report with all QC, identification, and quantification figures",
        "Prepare MIAPE-compliant metadata",
        "Upload raw data to PRIDE/ProteomeXchange",
        "Export supplementary tables for publication"
      ],
      tools: ["R Markdown / Quarto", "PRIDE Submission Tool", "MassIVE"],
      inputs: ["All analysis outputs"],
      outputs: ["Final report", "PRIDE dataset accession", "Supplementary tables"],
      parameters: { repository: "PRIDE / ProteomeXchange", format: "MIAPE-compliant" }
    }
  ]
};

export default function WorkflowBuilder({ open, onOpenChange, projectId, onCreated }) {
  const [mode, setMode] = useState("template"); // "template" | "upload" | "manual"
  const [form, setForm] = useState({ title: "", type: "other", description: "" });
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const createFromTemplate = async () => {
    setGenerating(true);
    const wf = await base44.entities.Workflow.create({
      project_id: projectId,
      title: PROTEOMICS_TEMPLATE.title,
      type: PROTEOMICS_TEMPLATE.type,
      description: PROTEOMICS_TEMPLATE.description,
      status: "draft",
      parameters: { steps: PROTEOMICS_TEMPLATE.steps },
    });
    setGenerating(false);
    onCreated(wf);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFile({ name: file.name, url: file_url });
    setUploading(false);
  };

  const generateFromDocument = async () => {
    if (!uploadedFile) return;
    setGenerating(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a scientific workflow automation specialist. Extract a structured digital workflow pipeline from the document provided.

Return a JSON object with this exact schema:
{
  "title": "string — workflow name",
  "description": "string — brief overall description",
  "steps": [
    {
      "title": "string",
      "type": "sample_prep|ms_acquisition|data_processing|protein_identification|quantification|statistical_analysis|bioinformatics|reporting",
      "status": "pending",
      "objective": "string",
      "steps": ["array of sub-step strings"],
      "tools": ["array of software/instrument names"],
      "inputs": ["what goes in"],
      "outputs": ["what comes out"],
      "parameters": { "key": "value pairs for key config params" }
    }
  ]
}

Assign the most appropriate type enum for each step. Extract all software tools mentioned. Keep parameters realistic and specific.`,
      file_urls: [uploadedFile.url],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          steps: { type: "array", items: { type: "object" } }
        }
      }
    });

    const wf = await base44.entities.Workflow.create({
      project_id: projectId,
      title: result.title || uploadedFile.name.replace(/\.[^.]+$/, ""),
      type: "other",
      description: result.description || "",
      status: "draft",
      parameters: { steps: result.steps || [] },
    });

    setGenerating(false);
    onCreated(wf);
  };

  const createManual = async () => {
    if (!form.title.trim()) return;
    setGenerating(true);
    const wf = await base44.entities.Workflow.create({
      project_id: projectId,
      title: form.title,
      type: form.type,
      description: form.description,
      status: "draft",
      parameters: { steps: [] },
    });
    setGenerating(false);
    onCreated(wf);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Workflow</DialogTitle>
          <p className="text-xs text-gray-400 mt-1">Choose how to create your scientific workflow pipeline.</p>
        </DialogHeader>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { id: "template", icon: "🧬", label: "Proteomics Template", sub: "Pre-built Waters LC-MS/MS" },
            { id: "upload", icon: "📄", label: "From Document", sub: "Upload SOP or protocol" },
            { id: "manual", icon: "✏️", label: "Manual", sub: "Start from scratch" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                mode === m.id ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-base mb-1">{m.icon}</p>
              <p className="text-xs font-semibold text-gray-700">{m.label}</p>
              <p className="text-[10px] text-gray-400">{m.sub}</p>
            </button>
          ))}
        </div>

        {/* Template mode */}
        {mode === "template" && (
          <div className="mt-3 p-4 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-xs font-semibold text-purple-700 mb-1">Waters Proteomics LC-MS/MS Pipeline</p>
            <p className="text-[11px] text-purple-500 leading-relaxed">8-step automated pipeline: Sample Prep → LC-MS/MS Acquisition → Data Processing → Protein Identification → Quantification → Statistical Analysis → Bioinformatics → Reporting. Pre-configured with Waters instruments, tools, parameters, inputs and outputs.</p>
          </div>
        )}

        {/* Upload mode */}
        {mode === "upload" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-500">Upload a protocol, SOP, or workflow document — we'll use AI to extract the steps automatically.</p>
            {!uploadedFile ? (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-300" />
                )}
                <p className="text-xs text-gray-400">{uploading ? "Uploading..." : "Click to upload .docx, .pdf, or .txt"}</p>
                <input type="file" className="hidden" accept=".docx,.pdf,.txt,.csv" onChange={handleFileUpload} disabled={uploading} />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <FileText className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-700 flex-1 truncate">{uploadedFile.name}</p>
                <button onClick={() => setUploadedFile(null)} className="text-gray-400 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Genomics Variant Calling Pipeline" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_silico_simulation">In-Silico Simulation</SelectItem>
                  <SelectItem value="meta_analysis">Meta-Analysis</SelectItem>
                  <SelectItem value="comparative_modelling">Comparative Modelling</SelectItem>
                  <SelectItem value="statistical_analysis">Statistical Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the workflow..." className="text-sm h-20 resize-none" />
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          {mode === "template" && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs" onClick={createFromTemplate} disabled={generating}>
              {generating ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Use Template</>}
            </Button>
          )}
          {mode === "upload" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={generateFromDocument} disabled={!uploadedFile || generating}>
              {generating ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Workflow</>}
            </Button>
          )}
          {mode === "manual" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={createManual} disabled={!form.title.trim() || generating}>
              {generating ? "Creating..." : "Create Workflow"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}