import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, Twitter, Linkedin, Facebook } from "lucide-react";

export default function InfographicModal({ asset, project, open, onClose, inline = false }) {
  const [infographic, setInfographic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if ((open || inline) && !infographic) generate();
  }, [open, inline]);

  const generate = async () => {
    setIsGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are generating structured content for a scientific research infographic styled like a Nature or Cell publication summary card.

Asset title: ${asset.title}
Project title: ${project?.title || "Research Project"}
Project field: ${project?.field || "Research"}
Asset description: ${asset.description || ""}

Generate a JSON object with these exact fields:
- field: short discipline label in uppercase (e.g. "BIOLOGY", "ONCOLOGY")
- title: bold headline in uppercase (max 7 words, punchy)
- author: plausible author name (e.g. "Dr. Jane Smith")
- date: use ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
- background: { summary: string (2 sentences), stats: [{ value: string, label: string }] (3 items with % or number values) }
- biomarkers: string (2 short sentences about key variables or components studied)
- methods: { summary: string (1 sentence), bullets: string[] (3 bullet points) }
- chart: [{ label: string, percentage: number }] (4 items, percentages that make sense for the research)
- results: { summary: string (1 sentence), table: { headers: string[] (3 headers), rows: string[][] (5 rows, 3 columns each) } }
- conclusion: string (2 sentences about the significance and impact)

Make everything scientifically credible and relevant to the asset/project context.`,
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
          biomarkers: { type: "string" },
          methods: {
            type: "object",
            properties: {
              summary: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            }
          },
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

  const handleDownload = async () => {
    if (!printRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#f0f2f5" });
    const link = document.createElement("a");
    link.download = `${asset.title.replace(/\s+/g, "_")}_infographic.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const card = infographic ? (
    /* ─── Infographic Card ─── */
    /* Square 1:1 ratio — fits Instagram & Facebook feed */
    <div
      ref={printRef}
      className="w-full bg-[#f0f2f5] p-4 font-sans"
      style={{ aspectRatio: "1/1", maxWidth: 600, margin: "0 auto" }}
    >
      {/* ── Header strip ── */}
      <div className="bg-white rounded-lg px-4 py-3 mb-3 flex items-start justify-between shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* tiny logo dot */}
            <div className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[6px] font-black text-white">U</span>
            </div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{infographic.field}</span>
          </div>
          <h1 className="text-lg font-black text-gray-900 uppercase leading-tight tracking-tight">{infographic.title}</h1>
          <p className="text-[9px] text-gray-400 mt-0.5">by {infographic.author} · published {infographic.date}</p>
        </div>
        <div className="flex gap-1.5 text-gray-300 ml-3 flex-shrink-0 mt-1">
          <div className="w-5 h-5 border border-gray-200 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-300">🔖</span>
          </div>
          <div className="w-5 h-5 border border-gray-200 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-300">↗</span>
          </div>
        </div>
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-3 gap-2.5 h-[calc(100%-88px)]">

        {/* COL 1: Background + The Biomarkers */}
        <div className="flex flex-col gap-2.5">
          {/* Background */}
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Background</h2>
            <p className="text-[8px] text-gray-500 leading-relaxed mb-2">{infographic.background?.summary}</p>
            <div className="space-y-2">
              {infographic.background?.stats?.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-base font-black text-gray-900 leading-none">{s.value}</span>
                  <div className="w-5 h-5 rounded bg-gray-100 flex-shrink-0" />
                  <span className="text-[7px] text-gray-400 leading-tight flex-1">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* The Biomarkers / Key Variables */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Key Variables</h2>
            <p className="text-[8px] text-gray-500 leading-relaxed">{infographic.biomarkers}</p>
          </div>
        </div>

        {/* COL 2: Methods + Chart */}
        <div className="flex flex-col gap-2.5">
          {/* Methods */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Method &amp; Measures</h2>
            <p className="text-[8px] text-gray-500 leading-relaxed mb-2">{infographic.methods?.summary}</p>
            <ul className="space-y-1 mb-3">
              {infographic.methods?.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-1 text-[7.5px] text-gray-500 leading-relaxed">
                  <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <div className="space-y-2">
              {infographic.chart?.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[7px] text-gray-500 w-10 text-right flex-shrink-0 leading-tight">{c.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full overflow-hidden" style={{ height: 8 }}>
                    <div
                      className="h-full rounded-full bg-gray-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                  <span className="text-[7px] font-bold text-gray-700 w-5 flex-shrink-0">{c.percentage}%</span>
                </div>
              ))}
            </div>
            {/* bullet footnotes */}
            <div className="mt-2 space-y-1">
              {infographic.methods?.bullets?.slice(0, 2).map((b, i) => (
                <p key={i} className="text-[6.5px] text-gray-400 leading-relaxed">
                  <span className="font-semibold">·</span> {b}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* COL 3: Results + Conclusion */}
        <div className="flex flex-col gap-2.5">
          {/* Results */}
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Results</h2>
            <p className="text-[7.5px] text-gray-500 leading-relaxed mb-2">{infographic.results?.summary}</p>
            {infographic.results?.table && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {infographic.results.table.headers?.map((h, i) => (
                      <th key={i} className="text-left text-[7px] text-gray-400 font-semibold pb-1 pr-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {infographic.results.table.rows?.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      {row.map((cell, j) => (
                        <td key={j} className="text-[7px] text-gray-600 py-0.5 pr-1 truncate max-w-[50px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Conclusion */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Conclusion</h2>
            <p className="text-[7.5px] text-gray-500 leading-relaxed">{infographic.conclusion}</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const toolbar = (
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-sm font-semibold text-gray-700">Research Infographic</h3>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={generate} className="text-xs" disabled={isGenerating}>
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Regenerate
        </Button>
        {infographic && (
          <>
            <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(infographic.title + " — " + (infographic.conclusion?.slice(0, 100) || ""))}`}
              target="_blank" rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs text-[#1DA1F2] border-[#1DA1F2]/30">
                <Twitter className="w-3.5 h-3.5 mr-1" />
                Twitter
              </Button>
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(infographic.title)}&summary=${encodeURIComponent(infographic.conclusion || "")}`}
              target="_blank" rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs text-[#0A66C2] border-[#0A66C2]/30">
                <Linkedin className="w-3.5 h-3.5 mr-1" />
                LinkedIn
              </Button>
            </a>
          </>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-gray-400">✕</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {toolbar}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Generating your infographic...</p>
        </div>
      ) : card}
    </div>
  );
}