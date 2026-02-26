import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ExternalLink, Download, ChevronLeft, ChevronRight } from "lucide-react";

export default function WorkflowHubImporter({ open, onClose, onImport }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [importingId, setImportingId] = useState(null);
    const [searched, setSearched] = useState(false);

    const search = async (p = 1) => {
        setLoading(true);
        setSearched(true);
        try {
            const res = await base44.functions.invoke("workflowHubSearch", { query, page: p });
            setResults(res.data.workflows || []);
            setTotalPages(res.data.total_pages || 1);
            setPage(p);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (wf) => {
        setImportingId(wf.id);
        try {
            await onImport({
                title: wf.title,
                description: wf.description,
                type: mapType(wf.workflow_type),
                status: "draft",
                parameters: {
                    source: "workflowhub",
                    workflowhub_id: wf.id,
                    source_url: wf.source_url,
                    workflow_type: wf.workflow_type,
                    tags: wf.tags,
                    license: wf.license,
                }
            });
        } finally {
            setImportingId(null);
        }
    };

    const mapType = (t = "") => {
        const lower = t.toLowerCase();
        if (lower.includes("galaxy") || lower.includes("nextflow") || lower.includes("snakemake") || lower.includes("cwl") || lower.includes("wdl")) return "in_silico_simulation";
        if (lower.includes("stat")) return "statistical_analysis";
        if (lower.includes("compar")) return "comparative_modelling";
        return "other";
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img src="https://workflowhub.eu/favicon.ico" alt="" className="w-4 h-4" onError={(e) => e.target.style.display='none'} />
                        Import from WorkflowHub
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search workflows (e.g. proteomics, RNA-seq, assembly…)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && search(1)}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={() => search(1)} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                    {!searched && (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
                            <Search className="w-8 h-8 opacity-30" />
                            Search WorkflowHub to find and import scientific workflows
                        </div>
                    )}
                    {loading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    )}
                    {!loading && searched && results.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                            No workflows found. Try a different search term.
                        </div>
                    )}
                    {!loading && results.map((wf) => (
                        <div key={wf.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 hover:bg-gray-50/50 transition-all">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm text-gray-900 leading-snug">{wf.title}</span>
                                        {wf.workflow_type && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal shrink-0">
                                                {wf.workflow_type}
                                            </Badge>
                                        )}
                                    </div>
                                    {wf.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{wf.description.replace(/[#*`]/g, "").slice(0, 200)}</p>
                                    )}
                                    {wf.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {wf.tags.slice(0, 5).map((tag, i) => (
                                                <span key={i} className="text-[10px] bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <a href={wf.source_url} target="_blank" rel="noreferrer">
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                        </Button>
                                    </a>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleImport(wf)}
                                        disabled={importingId === wf.id}
                                    >
                                        {importingId === wf.id
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <><Download className="w-3 h-3 mr-1" />Import</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && results.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <Button variant="ghost" size="sm" onClick={() => search(page - 1)} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                        <Button variant="ghost" size="sm" onClick={() => search(page + 1)} disabled={page >= totalPages}>
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}