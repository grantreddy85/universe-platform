import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function TabAIPanel({ tabName, contextData, isOpen, onToggle, onRecommendCohort, project, availableFilters, onSetFilters, onCreateCohort, hypotheses, notes, documents }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFilters, setSuggestedFilters] = useState(null);
  const [suggestedCohort, setSuggestedCohort] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [cohortCreated, setCohortCreated] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const context = contextData
      ? `\n\nCurrent ${tabName} data:\n${typeof contextData === "string" ? contextData : JSON.stringify(contextData, null, 2)}`
      : `\n\nNo ${tabName.toLowerCase()} data available yet.`;

    let prompt = `You are an expert research assistant helping a scientist with their ${tabName} module. Your role is to:
- Answer questions about the current ${tabName.toLowerCase()} data
- Provide guidance, suggestions, and best practices
- Help interpret and improve the research
- Identify patterns and insights
- Proactively recommend cohorts that will advance the project's research goals`;

    if (tabName === "Cohorts" && project) {
      const filterInfo = availableFilters
        ? `\n\nAvailable filters to define cohorts:\n${availableFilters}`
        : "";

      const cohortData = typeof contextData === "object" && contextData !== null ? contextData : {};
      const activeFilters = cohortData.activeFilters || [];
      const sampleSize = cohortData.sampleSize || "";
      const currentCohortName = cohortData.currentCohortName || "";
      const savedCohorts = cohortData.cohorts || [];
      
      const hypothesesContext = hypotheses?.length > 0
        ? hypotheses.map(h => `  - [${h.status}] ${h.title}: ${h.description || ""}`).join("\n")
        : "  None yet";

      const notesContext = notes?.length > 0
        ? notes.slice(0, 10).map(n => `  - ${n.title}: ${(n.content || "").slice(0, 200)}`).join("\n")
        : "  None yet";

      const documentsContext = documents?.length > 0
        ? documents.map(d => `  - ${d.title} (${d.file_type || "file"}): ${d.summary || d.methodology || "No summary"}`).join("\n")
        : "  None yet";

      prompt += `\n\nProject Context:
- Title: ${project.title}
- Description: ${project.description || "Not specified"}
- Field: ${project.field || "Not specified"}
- Tags: ${project.tags?.join(", ") || "None"}

Project Hypotheses:
${hypothesesContext}

Project Notes (most recent):
${notesContext}

Uploaded Documents & Data Files:
${documentsContext}

Current Cohort Being Built:
- Name: ${currentCohortName || "Not yet named"}
- Active Filters: ${activeFilters.length > 0 ? activeFilters.join(", ") : "None selected"}
- Sample Size: ${sampleSize || "Not specified"}

Saved Cohorts in Project (${savedCohorts.length}):
${savedCohorts.length > 0 ? savedCohorts.map(c => `- ${c.name} (status: ${c.status}, sample size: ${c.sample_size || "N/A"})`).join("\n") : "None yet"}

${filterInfo}

When the user asks for a cohort recommendation or you think it would help, proactively suggest a specific cohort. IMPORTANT: you MUST output the suggestion markers on their own lines like this:
SUGGESTED_FILTERS: ["age:30-45 Yr", "organism:Homo Sapiens", "data_type:RNA-Seq"]
SUGGESTED_COHORT: {"name": "Adult Humans RNA-Seq", "sample_size": 150}

Always explain WHY this cohort would help advance the project's research before showing the suggestion.`;
    }

    prompt += `\n\n${tabName} context:${context}\n\nUser question: ${input}\n\nProvide concise, insightful responses tailored to this research context.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: tabName === "Cohorts" });
    
    // Extract suggested filters and cohort from response
    if (tabName === "Cohorts") {
      // Try to extract SUGGESTED_FILTERS array
      const filterMatch = response.match(/SUGGESTED_FILTERS:\s*(\[[\s\S]*?\])/m);
      const cohortMatch = response.match(/SUGGESTED_COHORT:\s*(\{[^}]+\})/m);

      if (filterMatch) {
        try {
          const parsed = JSON.parse(filterMatch[1]);
          setSuggestedFilters(parsed);
          setFiltersApplied(false);
          setCohortCreated(false);
        } catch (e) {
          setSuggestedFilters(null);
        }
      } else {
        setSuggestedFilters(null);
      }

      if (cohortMatch) {
        try {
          const parsed = JSON.parse(cohortMatch[1]);
          setSuggestedCohort(parsed);
          setCohortCreated(false);
        } catch (e) {
          setSuggestedCohort(null);
        }
      } else {
        setSuggestedCohort(null);
      }
    }
    
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Notes Guide</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">
              Ask me anything about your {tabName.toLowerCase()}. I can help you analyse, improve, and get insights.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isLastAssistant = msg.role === "assistant" && idx === messages.length - 1;
            const hasSuggestion = isLastAssistant && (suggestedFilters || suggestedCohort);

            // Strip SUGGESTED_FILTERS / SUGGESTED_COHORT lines from display
            const displayContent = msg.role === "assistant"
              ? msg.content
                  .replace(/SUGGESTED_FILTERS:\s*\[[\s\S]*?\]/gm, "")
                  .replace(/SUGGESTED_COHORT:\s*\{[^}]+\}/gm, "")
                  .trim()
              : msg.content;

            return (
              <React.Fragment key={idx}>
                <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-50 text-gray-800 border border-gray-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {displayContent}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>

                {/* Inline action card directly after the assistant message that has suggestions */}
                {hasSuggestion && (
                  <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-800">Recommended Cohort Plan</p>

                    {suggestedFilters && (
                      <div>
                        <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide mb-1.5">Suggested Filters</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestedFilters.map((filter) => (
                            <span key={filter} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">{filter}</span>
                          ))}
                        </div>
                        {!filtersApplied ? (
                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-7"
                            onClick={() => {
                              onSetFilters?.(suggestedFilters);
                              setFiltersApplied(true);
                            }}
                          >
                            ✦ Apply Filters to Study Finder
                          </Button>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-medium">✓ Filters applied to Study Finder</div>
                        )}
                      </div>
                    )}

                    {suggestedCohort && (
                      <div>
                        <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-1.5">Suggested Cohort</p>
                        <div className="text-xs text-gray-700 mb-2">
                          <p className="font-semibold">{suggestedCohort.name}</p>
                          {suggestedCohort.sample_size && <p className="text-gray-500">Sample size: {suggestedCohort.sample_size}</p>}
                        </div>
                        {!cohortCreated ? (
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                            onClick={() => {
                              const cohortPayload = {
                                ...suggestedCohort,
                                filters: (suggestedFilters || []).map((f) => {
                                  const [field, ...rest] = f.split(":");
                                  return { field: field.trim(), operator: "equals", value: rest.join(":").trim() };
                                }),
                              };
                              onCreateCohort?.(cohortPayload);
                              setCohortCreated(true);
                            }}
                          >
                            ✦ Create Cohort from Filters
                          </Button>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-medium">✓ Cohort created</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recommend Cohort Button */}
      {tabName === "Cohorts" && (
        <div className="border-t border-gray-100 p-3">
          <Button
            onClick={() => {
              setFiltersApplied(false);
              setCohortCreated(false);
              setSuggestedFilters(null);
              setSuggestedCohort(null);
              setInput("Based on this project's research goals and any existing cohorts, recommend the most useful cohort I should build next — including specific filters and sample size.");
              setTimeout(() => {
                document.getElementById("ai-panel-send-btn")?.click();
              }, 50);
            }}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
            disabled={isLoading}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Recommend Cohort
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask a question..."
            className="text-xs"
            disabled={isLoading}
          />
          <Button
            id="ai-panel-send-btn"
            onClick={sendMessage}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}