import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles, BookmarkPlus, Share2 } from "lucide-react";

export default function InfographicModal({ asset, project, open, onClose, inline = false }) {
  const [infographic, setInfographic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if ((open || inline) && !infographic) generate();
  }, [open, inline]);

  const generate = async () => {
    setIsGenerating(true);
    const prompt = `You are generating structured content for a scientific research infographic publication.

Asset title: ${asset.title}
Project title: ${project.title}
Project field: ${project.field || "Research"}
Asset description: ${asset.description || ""}

Generate a JSON object for a publication-style infographic with these exact fields:
- field: short discipline label (e.g. "BIOLOGY")
- title: uppercase bold headline (max 8 words)
- author: plausible author name (use "Research Team" if unknown)
- date: today's date formatted as "DD/MM/YYYY" (use ${new Date().toLocaleDateString("en-GB")})
- background: object with { summary: string (2 sentences), stats: array of { value: string, label: string } (3 items) }
- methods: object with { summary: string (1 sentence), bullets: string[] (3 items) }
- biomarkers: string (2 sentences of supporting context or key variables studied)
- chart: array of { label: string, percentage: number } (4 items representing sample breakdown or key data distribution)
- results: object with { summary: string (1 sentence), table: { headers: string[], rows: string[][] } (3 columns, 5 rows) }
- conclusion: string (2 sentences summarising the significance)

Base this on the project and asset context. Make it realistic and scientifically credible.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          field: { type: "string" },
          title: { type: "string" },
          author: { type: "string" },
          date: { type: "string" },
          background: {
            type: "object",
            properties: {
              summary: { type: "string" },
              stats: { type: "array", items: { type: "object", properties: { value: { type: "string" }, label: { type: "string" } } } }
            }
          },
          methods: {
            type: "object",
            properties: {
              summary: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            }
          },
          biomarkers: { type: "string" },
          chart: { type: "array", items: { type: "object", properties: { label: { type: "string" }, percentage: { type: "number" } } } },
          results: {
            type: "object",
            properties: {
              summary: { type: "string" },
              table: {
                type: "object",
                properties: {
                  headers: { type: "array", items: { type: "string" } },
                  rows: { type: "array", items: { type: "array", items: { type: "string" } } }
                }
              }
            }
          },
          conclusion: { type: "string" }
        }
      }
    });
    setInfographic(result);
    setIsGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">Research Infographic</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={generate} className="text-xs" disabled={isGenerating}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Generating your infographic...</p>
          </div>
        ) : infographic ? (
          <div ref={printRef} className="p-6 bg-[#f8f9fc]">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 mb-4 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 rounded px-2 py-0.5">{infographic.field}</span>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase leading-tight mb-2">{infographic.title}</h1>
                  <p className="text-xs text-gray-500">by {infographic.author} · published {infographic.date}</p>
                </div>
                <div className="flex gap-2 text-gray-300">
                  <BookmarkPlus className="w-5 h-5" />
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Background */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Background</h2>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">{infographic.background?.summary}</p>
                <div className="space-y-3">
                  {infographic.background?.stats?.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-900">{s.value}</span>
                      <span className="text-[11px] text-gray-500 leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methods */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Method &amp; Measures</h2>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{infographic.methods?.summary}</p>
                <ul className="space-y-2">
                  {infographic.methods?.bullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {/* Simple bar chart */}
                <div className="mt-4 space-y-2">
                  {infographic.chart?.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-16 text-right flex-shrink-0">{c.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-blue-400"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 w-8">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Results</h2>
                <p className="text-xs text-gray-600 mb-3">{infographic.results?.summary}</p>
                {infographic.results?.table && (
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {infographic.results.table.headers?.map((h, i) => (
                          <th key={i} className="text-left text-gray-400 font-medium pb-1.5 pr-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {infographic.results.table.rows?.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {row.map((cell, j) => (
                            <td key={j} className="text-gray-600 py-1.5 pr-2">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Biomarkers / Context */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Key Context</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{infographic.biomarkers}</p>
              </div>

              {/* Conclusion */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 col-span-2">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Conclusion</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{infographic.conclusion}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}