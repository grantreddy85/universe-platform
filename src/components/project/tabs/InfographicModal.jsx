import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, Twitter, Linkedin, Pencil, Check, X } from "lucide-react";

// Editable text cell – click to edit inline
function EditableText({ value, onChange, className, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    const Tag = multiline ? "textarea" : "input";
    return (
      <span className="relative inline-block w-full">
        <Tag
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (!multiline && e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          onBlur={commit}
          className={`${className} border border-blue-400 rounded px-0.5 bg-white outline-none w-full resize-none`}
          rows={multiline ? 3 : undefined}
        />
      </span>
    );
  }
  return (
    <span
      className={`${className} cursor-text hover:bg-blue-50/60 rounded px-0.5 transition-colors`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || <span className="italic text-gray-300">click to edit</span>}
    </span>
  );
}

export default function InfographicModal({ asset, project, open, onClose, inline = false }) {
  const [infographic, setInfographic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedConfirm, setSavedConfirm] = useState(false);
  const printRef = useRef(null);

  // Load persisted infographic from asset metadata on open — always fetch fresh from DB
  useEffect(() => {
    if ((open || inline) && asset) {
      setInfographic(null);
      base44.entities.Asset.filter({ project_id: asset.project_id }).then((results) => {
        const fresh = results.find((a) => a.id === asset.id);
        if (fresh?.metadata?.infographic) {
          setInfographic(fresh.metadata.infographic);
        } else {
          generate();
        }
      });
    }
  }, [open, inline, asset?.id]);

  const saveToAsset = async (data) => {
    await base44.entities.Asset.update(asset.id, {
      metadata: { ...(asset.metadata || {}), infographic: data },
    });
  };

  const handleManualSave = async () => {
    if (!infographic) return;
    setIsSaving(true);
    await saveToAsset(infographic);
    setIsSaving(false);
    setSavedConfirm(true);
    setTimeout(() => setSavedConfirm(false), 2000);
  };

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
    await saveToAsset(result);
  };

  const updateField = (path, value) => {
    setInfographic(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      saveToAsset(next);
      return next;
    });
  };

  const updateArrayField = (path, index, subKey, value) => {
    setInfographic(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (const k of keys) obj = obj[k];
      if (subKey) obj[index][subKey] = value;
      else obj[index] = value;
      saveToAsset(next);
      return next;
    });
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

  const E = editMode ? EditableText : ({ value, className }) => <span className={className}>{value}</span>;

  const card = infographic ? (
    <div
      ref={printRef}
      className="w-full bg-[#f0f2f5] p-4 font-sans"
      style={{ aspectRatio: "1/1", maxWidth: 600, margin: "0 auto" }}
    >
      {/* Header */}
      <div className="bg-white rounded-lg px-4 py-3 mb-3 flex items-start justify-between shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[6px] font-black text-white">U</span>
            </div>
            <E value={infographic.field} onChange={(v) => updateField("field", v)} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest" />
          </div>
          <E value={infographic.title} onChange={(v) => updateField("title", v)} className="text-lg font-black text-gray-900 uppercase leading-tight tracking-tight block" />
          <div className="text-[9px] text-gray-400 mt-0.5 flex gap-1">
            <span>by</span>
            <E value={infographic.author} onChange={(v) => updateField("author", v)} className="text-[9px] text-gray-400" />
            <span>·</span>
            <E value={infographic.date} onChange={(v) => updateField("date", v)} className="text-[9px] text-gray-400" />
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-2.5 h-[calc(100%-88px)]">

        {/* COL 1 */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Background</h2>
            <E value={infographic.background?.summary} onChange={(v) => updateField("background.summary", v)} className="text-[8px] text-gray-500 leading-relaxed mb-2 block" multiline />
            <div className="space-y-2">
              {infographic.background?.stats?.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <E value={s.value} onChange={(v) => updateArrayField("background.stats", i, "value", v)} className="text-base font-black text-gray-900 leading-none" />
                  <div className="w-5 h-5 rounded bg-gray-100 flex-shrink-0" />
                  <E value={s.label} onChange={(v) => updateArrayField("background.stats", i, "label", v)} className="text-[7px] text-gray-400 leading-tight flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Key Variables</h2>
            <E value={infographic.biomarkers} onChange={(v) => updateField("biomarkers", v)} className="text-[8px] text-gray-500 leading-relaxed block" multiline />
          </div>
        </div>

        {/* COL 2 */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Method &amp; Measures</h2>
            <E value={infographic.methods?.summary} onChange={(v) => updateField("methods.summary", v)} className="text-[8px] text-gray-500 leading-relaxed mb-2 block" multiline />
            <ul className="space-y-1 mb-3">
              {infographic.methods?.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-1 text-[7.5px] text-gray-500 leading-relaxed">
                  <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <E value={b} onChange={(v) => updateArrayField("methods.bullets", i, null, v)} className="text-[7.5px] text-gray-500" />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <div className="space-y-2">
              {infographic.chart?.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <E value={c.label} onChange={(v) => updateArrayField("chart", i, "label", v)} className="text-[7px] text-gray-500 w-10 text-right flex-shrink-0 leading-tight" />
                  <div className="flex-1 bg-gray-100 rounded-full overflow-hidden" style={{ height: 8 }}>
                    <div className="h-full rounded-full bg-gray-500" style={{ width: `${c.percentage}%` }} />
                  </div>
                  <E value={String(c.percentage)} onChange={(v) => updateArrayField("chart", i, "percentage", Number(v) || 0)} className="text-[7px] font-bold text-gray-700 w-5 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COL 3 */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Results</h2>
            <E value={infographic.results?.summary} onChange={(v) => updateField("results.summary", v)} className="text-[7.5px] text-gray-500 leading-relaxed mb-2 block" multiline />
            {infographic.results?.table && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {infographic.results.table.headers?.map((h, i) => (
                      <th key={i} className="text-left text-[7px] text-gray-400 font-semibold pb-1 pr-1">
                        <E value={h} onChange={(v) => { const next = [...infographic.results.table.headers]; next[i] = v; updateField("results.table.headers", next); }} className="text-[7px] text-gray-400 font-semibold" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {infographic.results.table.rows?.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      {row.map((cell, j) => (
                        <td key={j} className="text-[7px] text-gray-600 py-0.5 pr-1 truncate max-w-[50px]">
                          <E value={cell} onChange={(v) => { const nextRows = infographic.results.table.rows.map(r => [...r]); nextRows[i][j] = v; updateField("results.table.rows", nextRows); }} className="text-[7px] text-gray-600" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">Conclusion</h2>
            <E value={infographic.conclusion} onChange={(v) => updateField("conclusion", v)} className="text-[7.5px] text-gray-500 leading-relaxed block" multiline />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const toolbar = (
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-sm font-semibold text-gray-700">Research Infographic</h3>
      <div className="flex items-center gap-2">
        <Button
          variant={editMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setEditMode(!editMode)}
          className={`text-xs ${editMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
          disabled={!infographic}
        >
          {editMode ? <><Check className="w-3.5 h-3.5 mr-1" />Done Editing</> : <><Pencil className="w-3.5 h-3.5 mr-1" />Edit</>}
        </Button>
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
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(infographic.title + " — " + (infographic.conclusion?.slice(0, 100) || ""))}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="text-xs text-[#1DA1F2] border-[#1DA1F2]/30">
                <Twitter className="w-3.5 h-3.5 mr-1" />Twitter
              </Button>
            </a>
            <a href={`https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(infographic.title)}&summary=${encodeURIComponent(infographic.conclusion || "")}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="text-xs text-[#0A66C2] border-[#0A66C2]/30">
                <Linkedin className="w-3.5 h-3.5 mr-1" />LinkedIn
              </Button>
            </a>
          </>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-gray-400"><X className="w-3.5 h-3.5" /></Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {toolbar}
      {editMode && infographic && (
        <p className="text-[11px] text-blue-500 mb-2 px-1">Click any text on the infographic to edit it. Changes save automatically.</p>
      )}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Generating your infographic...</p>
        </div>
      ) : card}
    </div>
  );
}