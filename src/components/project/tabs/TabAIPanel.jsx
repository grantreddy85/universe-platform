import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function TabAIPanel({ tabName, contextData, isOpen, onToggle, onRecommendCohort, project, availableFilters, onSetFilters, onCreateCohort }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFilters, setSuggestedFilters] = useState(null);
  const [suggestedCohort, setSuggestedCohort] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
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
        ? `\n\nAvailable filters to define cohorts:
${availableFilters}`
        : "";

      const cohortData = typeof contextData === "object" && contextData !== null ? contextData : {};
      const activeFilters = cohortData.activeFilters || [];
      const sampleSize = cohortData.sampleSize || "";
      const currentCohortName = cohortData.currentCohortName || "";
      const savedCohorts = cohortData.cohorts || [];
      
      prompt += `\n\nProject Context:
- Title: ${project.title}
- Description: ${project.description || "Not specified"}
- Field: ${project.field || "Not specified"}
- Tags: ${project.tags?.join(", ") || "None"}

Current Cohort Being Built:
- Name: ${currentCohortName || "Not yet named"}
- Active Filters: ${activeFilters.length > 0 ? activeFilters.join(", ") : "None selected"}
- Sample Size: ${sampleSize || "Not specified"}

Saved Cohorts in Project (${savedCohorts.length}):
${savedCohorts.length > 0 ? savedCohorts.map(c => `- ${c.name} (status: ${c.status}, sample size: ${c.sample_size || "N/A"})`).join("\n") : "None yet"}

${filterInfo}

When the user asks for a cohort recommendation or you think it would help, proactively suggest a specific cohort that builds upon the project's existing research. Consider:
- The project's title, description, field, and tags
- Any existing saved cohorts (avoid duplicating them)
- The current active filters being used
- What population or dataset would most meaningfully advance this research

Be aware of the current cohort being built and reference its filters and configuration when relevant.

You can offer to apply filters or create cohorts. When you suggest filters or a cohort, format your suggestion like this:
SUGGESTED_FILTERS: ["age:30-45 Yr", "organism:Homo Sapiens", "data_type:RNA-Seq"]
SUGGESTED_COHORT: {"name": "Adult Humans RNA-Seq", "sample_size": 150}

Always explain WHY this cohort would help advance the project's research before showing the suggestion.`;
    }

    prompt += `${tabName} context:${context}

User question: ${input}

Provide concise, insightful responses tailored to this research context.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    
    // Extract suggested filters and cohort from response
    if (tabName === "Cohorts") {
      const filterMatch = response.match(/SUGGESTED_FILTERS:\s*(\[.*?\])/);
      const cohortMatch = response.match(/SUGGESTED_COHORT:\s*(\{.*?\})/);
      
      if (filterMatch) {
        try {
          setSuggestedFilters(JSON.parse(filterMatch[1]));
        } catch (e) {
          setSuggestedFilters(null);
        }
      }
      if (cohortMatch) {
        try {
          setSuggestedCohort(JSON.parse(cohortMatch[1]));
        } catch (e) {
          setSuggestedCohort(null);
        }
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
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-800 border border-gray-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            </div>
          </div>
        )}
        
        {(suggestedFilters || suggestedCohort) && !isLoading && (
          <div className="space-y-2">
            {suggestedFilters && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">Suggested Filters:</p>
                <div className="space-y-1 mb-2">
                  {suggestedFilters.map((filter) => (
                    <div key={filter} className="text-xs text-blue-800">{filter}</div>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-7"
                  onClick={() => {
                    onSetFilters?.(suggestedFilters);
                    setSuggestedFilters(null);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            )}
            
            {suggestedCohort && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-900 mb-2">Suggested Cohort:</p>
                <div className="text-xs text-emerald-800 mb-2">
                  <p><strong>{suggestedCohort.name}</strong></p>
                  {suggestedCohort.sample_size && (
                    <p>Sample Size: {suggestedCohort.sample_size}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                  onClick={() => {
                    onCreateCohort?.(suggestedCohort);
                    setSuggestedCohort(null);
                  }}
                >
                  Create Cohort
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Actions */}
      {tabName === "Cohorts" && (
        <div className="border-t border-gray-100 p-3">
          <Button
            onClick={() => {
              setFiltersApplied(false);
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