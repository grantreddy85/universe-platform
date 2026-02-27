import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Lightbulb, BookOpen, Users, TrendingUp, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";

const SUGGESTED_PROMPTS = [
  {
    icon: Lightbulb,
    label: "Generate hypothesis",
    prompt: "Based on all the notes, documents, and research in this project, identify gaps and propose a novel, testable hypothesis with supporting evidence and a suggested experimental approach.",
    color: "#6366f1",
    highlight: true,
  },
  {
    icon: BookOpen,
    label: "Summarise project",
    prompt: "Give me a concise summary of this project's current state — what has been done, what the key findings are so far, and what the next logical steps are.",
    color: "#3b82f6",
  },
  {
    icon: Users,
    label: "Cohort strategy",
    prompt: "Based on the project hypotheses and notes, what is the ideal cohort strategy? Suggest patient population criteria, sample size, and key inclusion/exclusion filters.",
    color: "#10b981",
  },
  {
    icon: TrendingUp,
    label: "Validation readiness",
    prompt: "Assess this project's readiness for validation. What evidence is in place, what is missing, and what are the recommended next steps before submitting for validation?",
    color: "#f59e0b",
  },
];

export default function ProjectIntelligence({ project, notes = [], documents = [], hypotheses = [], cohorts = [], workflows = [] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIndex, setSavedIndex] = useState(null);
  const [savingIndex, setSavingIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const notesSummary = notes.length > 0
      ? notes.slice(0, 20).map(n => `- "${n.title}": ${(n.content || "").slice(0, 200)}`).join("\n")
      : "None yet";

    const docsSummary = documents.length > 0
      ? documents.slice(0, 10).map(d => `- "${d.title}" (${d.file_type || "file"}): ${d.summary || d.methodology || "No summary"}`).join("\n")
      : "None yet";

    const hypothesesSummary = hypotheses.length > 0
      ? hypotheses.map(h => `- [${h.status}] "${h.title}": ${(h.description || "").slice(0, 200)}`).join("\n")
      : "None yet";

    const cohortsSummary = cohorts.length > 0
      ? cohorts.map(c => `- "${c.name}" (${c.status}, n=${c.sample_size || "?"}): ${c.organism || ""} ${c.strain || ""}`).join("\n")
      : "None yet";

    const workflowsSummary = workflows.length > 0
      ? workflows.map(w => `- "${w.title}" (${w.type}, ${w.status}): ${(w.description || "").slice(0, 150)}`).join("\n")
      : "None yet";

    return { notesSummary, docsSummary, hypothesesSummary, cohortsSummary, workflowsSummary };
  };

  const send = async (promptText) => {
    const text = promptText || input;
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);
    setMessages(m => [...m, { role: "user", content: text }]);

    const { notesSummary, docsSummary, hypothesesSummary, cohortsSummary, workflowsSummary } = buildContext();

    const systemPrompt = `You are the Project Intelligence assistant for the UniVerse research platform. You have deep context on a single research project and your role is to help the researcher generate insights, hypotheses, and strategic guidance based solely on the project's data.

PROJECT DETAILS:
Title: ${project.title}
Description: ${project.description || "Not specified"}
Field: ${project.field || "Not specified"}
Status: ${project.status}
Tags: ${project.tags?.join(", ") || "None"}

PROJECT KNOWLEDGE BASE:

=== Notes (${notes.length}) ===
${notesSummary}

=== Vault Documents (${documents.length}) ===
${docsSummary}

=== Hypotheses (${hypotheses.length}) ===
${hypothesesSummary}

=== Cohorts (${cohorts.length}) ===
${cohortsSummary}

=== Workflows (${workflows.length}) ===
${workflowsSummary}

Respond helpfully and specifically to this project's data. Be concise but thorough. If recommending a hypothesis, format it clearly with: Gap Identified, Supporting Evidence, Hypothesis Statement, Suggested Approach.

User query: ${text}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      add_context_from_internet: true,
    });

    setMessages(m => [...m, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const saveAsNote = async (content, index) => {
    setSavingIndex(index);
    const isHypothesis = content.toLowerCase().includes("hypothesis statement") || content.toLowerCase().includes("gap identified");
    const title = `Project Intelligence — ${new Date().toLocaleDateString()}`;

    if (isHypothesis) {
      await base44.entities.Hypothesis.create({
        project_id: project.id,
        title,
        description: content.slice(0, 1000),
        status: "draft",
        source: "ai_generated",
      });
      queryClient.invalidateQueries({ queryKey: ["project-hypotheses", project.id] });
    } else {
      await base44.entities.Note.create({
        project_id: project.id,
        title,
        content,
        source: "ai_copilot",
        tags: ["project-intelligence"],
      });
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
    }

    setSavingIndex(null);
    setSavedIndex(index);
    setTimeout(() => setSavedIndex(null), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#000021] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#00F2FF]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">Project Intelligence</p>
            <p className="text-[10px] text-gray-400">AI across all project knowledge</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="grid grid-cols-2 gap-1.5">
          {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt, color, highlight }) => (
            <button
              key={label}
              onClick={() => send(prompt)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] transition-all hover:scale-[1.02] disabled:opacity-50 ${
                highlight
                  ? "bg-[#000021] text-[#00F2FF] border border-[#00F2FF]/20"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color: highlight ? "#00F2FF" : color }} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-xs text-gray-400 max-w-xs">
              Ask anything about this project — or use a suggested prompt above to generate insights and hypotheses from your project data.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-xs bg-[#000021] text-white">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[90%] space-y-2">
                  <div className="rounded-xl px-4 py-3 text-sm bg-gray-50 border border-gray-200 text-gray-700">
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveAsNote(m.content, i)}
                      disabled={savingIndex === i}
                      className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {savingIndex === i ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : savedIndex === i ? (
                        <span className="text-green-500">Saved ✓</span>
                      ) : (
                        <><Save className="w-3 h-3" /> Save to project</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Analysing project knowledge…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) send(); }}
          placeholder="Ask anything about this project…"
          className="text-xs h-9 bg-gray-50"
          disabled={loading}
        />
        <Button
          onClick={() => send()}
          size="icon"
          className="h-9 w-9 bg-[#000021] hover:bg-[#000021]/90 flex-shrink-0"
          disabled={!input.trim() || loading}
        >
          <Send className="w-3.5 h-3.5 text-[#00F2FF]" />
        </Button>
      </div>
    </div>
  );
}