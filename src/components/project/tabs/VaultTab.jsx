import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  Tag,
  Sparkles
} from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const typeColors = {
  pdf: "bg-red-50 text-red-600",
  csv: "bg-green-50 text-green-600",
  dataset: "bg-blue-50 text-blue-600",
  image: "bg-purple-50 text-purple-600",
  other: "bg-gray-50 text-gray-600",
};

export default function VaultTab({ project }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["project-docs", project.id],
    queryFn: () =>
      base44.entities.ProjectDocument.filter({ project_id: project.id }, "-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-docs", project.id] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileType =
      ext === "pdf" ? "pdf" : ext === "csv" ? "csv" : ["jpg", "jpeg", "png", "webp"].includes(ext) ? "image" : "other";

    await base44.entities.ProjectDocument.create({
      project_id: project.id,
      title: file.name,
      file_url,
      file_type: fileType,
    });
    queryClient.invalidateQueries({ queryKey: ["project-docs", project.id] });
    setUploading(false);
    e.target.value = "";
  };

  const filtered = documents.filter((d) => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.file_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex h-full">
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Knowledge Vault
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiOpen(!aiOpen)}
            className={`text-xs h-7 px-2.5 ${aiOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Notes Guide
          </Button>
          <label>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs cursor-pointer"
              disabled={uploading}
              asChild
            >
              <span>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {uploading ? "Uploading..." : "Upload"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
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
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {documents.length === 0
              ? "Upload research papers, datasets, or any relevant files."
              : "No documents match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    typeColors[doc.file_type] || typeColors.other
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase ${
                        typeColors[doc.file_type] || typeColors.other
                      }`}
                    >
                      {doc.file_type}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {doc.created_date && format(new Date(doc.created_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
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
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
    <TabAIPanel
      tabName="Vault"
      contextData={documents.map(d => ({ title: d.title, type: d.file_type, summary: d.summary }))}
      isOpen={aiOpen}
      onToggle={() => setAiOpen(!aiOpen)}
    />
    </div>
  );
}