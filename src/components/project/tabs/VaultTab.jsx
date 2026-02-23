import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, FileText, Search, Filter, MoreHorizontal,
  Download, Trash2, Sparkles, Brain, BookOpen, Database,
  Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import VaultSidebar from "./VaultSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const typeColors = {
  pdf: "bg-red-50 text-red-600",
  csv: "bg-green-50 text-green-600",
  dataset: "bg-blue-50 text-blue-600",
  image: "bg-purple-50 text-purple-600",
  other: "bg-gray-50 text-gray-600",
};

const typeIcons = { pdf: "📄", csv: "📊", dataset: "🗄️", image: "🖼️", other: "📎" };

function DocCard({ doc, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${typeColors[doc.file_type] || typeColors.other}`}>
            {typeIcons[doc.file_type] || "📎"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[10px] uppercase ${typeColors[doc.file_type] || typeColors.other}`}>
                {doc.file_type || "other"}
              </Badge>
              {doc.summary && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <Brain className="w-2.5 h-2.5" /> Indexed
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {doc.created_date && format(new Date(doc.created_date), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {doc.summary && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {doc.file_url && (
                <DropdownMenuItem asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(doc.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && doc.summary && (
        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="mt-2 p-3 bg-blue-50/50 rounded-lg">
            <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3" /> AI Summary
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">{doc.summary}</p>
          </div>
          {doc.methodology && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">Methodology:</span>
              <Badge variant="secondary" className="text-[10px]">{doc.methodology}</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VaultTab({ project }) {
  const [selectedVaultId, setSelectedVaultId] = useState(null); // null = all
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [processingIds, setProcessingIds] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: vaults = [] } = useQuery({
    queryKey: ["vaults", project.id],
    queryFn: () => base44.entities.Vault.filter({ project_id: project.id }, "created_date", 50),
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["project-docs", project.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project.id }, "-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-docs", project.id] }),
  });

  // Count docs per vault
  const docCounts = documents.reduce((acc, doc) => {
    const key = doc.vault_id || "__none__";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Filter documents by selected vault
  const vaultFiltered = selectedVaultId === null
    ? documents
    : documents.filter((d) => d.vault_id === selectedVaultId);

  const filtered = vaultFiltered.filter((d) => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.summary?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.file_type === typeFilter;
    return matchSearch && matchType;
  });

  const indexedCount = vaultFiltered.filter((d) => d.summary).length;

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const ext = file.name.split(".").pop()?.toLowerCase();
      const fileType =
        ext === "pdf" ? "pdf"
        : ext === "csv" ? "csv"
        : ["jpg", "jpeg", "png", "webp"].includes(ext) ? "image"
        : ["json", "tsv", "xlsx"].includes(ext) ? "dataset"
        : "other";

      const docData = {
        project_id: project.id,
        title: file.name,
        file_url,
        file_type: fileType,
      };
      if (selectedVaultId) docData.vault_id = selectedVaultId;

      const doc = await base44.entities.ProjectDocument.create(docData);
      queryClient.invalidateQueries({ queryKey: ["project-docs", project.id] });
      
      setProcessingIds((prev) => [...prev, doc.id]);
      await processDocument(doc, file_url);
      setProcessingIds((prev) => prev.filter((id) => id !== doc.id));
    }
    
    e.target.value = "";
    setUploading(false);
  };

  const processDocument = async (doc, file_url) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are indexing a research document for a RAG knowledge base. 
The document is titled: "${doc.title}" and is part of the research project: "${project.title}" (field: ${project.field || "research"}).
Analyse the document and return a structured summary for AI-assisted search and retrieval.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          key_findings: { type: "array", items: { type: "string" } },
          methodology: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    });

    await base44.entities.ProjectDocument.update(doc.id, {
      summary: result.summary,
      methodology: result.methodology,
      tags: result.keywords || [],
    });

    queryClient.invalidateQueries({ queryKey: ["project-docs", project.id] });
  };

  const selectedVault = vaults.find((v) => v.id === selectedVaultId);
  const vaultLabel = selectedVault ? selectedVault.name : "All Documents";

  return (
    <div className="flex h-full">
      {/* Vault sidebar */}
      <VaultSidebar
        projectId={project.id}
        vaults={vaults}
        selectedVaultId={selectedVaultId}
        onSelect={setSelectedVaultId}
        docCounts={docCounts}
      />

      {/* Main area */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              {vaultLabel}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {selectedVaultId
                ? `Documents in this vault. AI co-pilot learns from everything indexed here.`
                : "All documents across all vaults in this project."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiOpen(!aiOpen)}
              className={`text-xs h-7 px-2.5 ${aiOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ask AI
            </Button>
            <label>
              <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading || processingIds.length > 0} />
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs cursor-pointer"
                disabled={uploading || processingIds.length > 0}
                asChild
              >
                <span>
                  {uploading || processingIds.length > 0 ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploading ? "Uploading..." : processingIds.length > 0 ? `Indexing ${processingIds.length}...` : selectedVaultId ? `Upload to ${selectedVault?.name}` : "Upload"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Stats bar */}
        {vaultFiltered.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{vaultFiltered.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Documents</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{indexedCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">AI Indexed</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
              <p className="text-lg font-bold text-blue-600">
                {vaultFiltered.length > 0 ? Math.round((indexedCount / vaultFiltered.length) * 100) : 0}%
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Coverage</p>
            </div>
          </div>
        )}

        {/* Processing banner */}
        {processingId && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-700">Indexing document…</p>
              <p className="text-[10px] text-blue-500">AI is extracting key findings, methodology and keywords.</p>
            </div>
          </div>
        )}

        {/* Search & filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents and AI summaries..."
              className="pl-9 text-sm h-9 bg-white"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-28 h-9 text-xs bg-white">
              <Filter className="w-3 h-3 mr-1.5 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="dataset">Dataset</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
                <div className="h-4 w-48 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400 mb-1">
              {vaultFiltered.length === 0 ? "This vault is empty" : "No documents match your search"}
            </p>
            <p className="text-xs text-gray-300 max-w-xs mx-auto">
              {vaultFiltered.length === 0
                ? "Upload research papers, datasets, lab results, or any unpublished data."
                : "Try a different search term or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => (
              <DocCard key={doc.id} doc={doc} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <TabAIPanel
        tabName="Knowledge Vault"
        contextData={vaultFiltered.map((d) => ({
          title: d.title, type: d.file_type, summary: d.summary,
          methodology: d.methodology, keywords: d.tags,
        }))}
        isOpen={aiOpen}
        onToggle={() => setAiOpen(!aiOpen)}
        systemPrompt={`You are the AI co-pilot for the research project "${project.title}". 
You have access to the ${selectedVault ? `"${selectedVault.name}" vault` : "full knowledge vault"} with ${vaultFiltered.length} documents.
Use the document summaries and metadata to answer questions, identify connections, and suggest hypotheses.`}
      />
    </div>
  );
}