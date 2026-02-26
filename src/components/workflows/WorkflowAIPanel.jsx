import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Send, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

const SUGGESTED_PROMPTS = [
  "What WorkflowHub workflows would suit this research?",
  "What bioinformatics pipelines are recommended for this project?",
  "Suggest workflows for statistical analysis of this data.",
];

export default function WorkflowAIPanel({ project, onClose, onOpenImporter }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const userMessage = (text || query).trim();
    if (!userMessage || loading) return;
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const projectContext = `
Project Title: "${project?.title || "Unknown"}"
Description: "${project?.description || "Not provided"}"
Field: "${project?.field || "Not specified"}"
Tags: ${project?.tags?.join(", ") || "None"}
Status: ${project?.status || "draft"}
    `.trim();

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a scientific workflow advisor helping a researcher find suitable workflows from the WorkflowHub registry (workflowhub.eu).

${projectContext}

User question: ${userMessage}

Based on the project context above, recommend specific types of workflows from WorkflowHub that would be suitable. 
- Suggest 2-4 concrete workflow categories or specific named workflows where you know them.
- Explain briefly why each is relevant to this project.
- Mention that they can search and import directly using the "Import from WorkflowHub" button.
- Keep your response concise and actionable.`,
      add_context_from_internet: true,
    });

    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-100 bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-gray-700">Workflow Guide</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Project context pill */}
      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-[10px] text-gray-400 truncate">
          <span className="font-medium text-gray-500">Project: </span>{project?.title || "Untitled"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <Sparkles className="w-6 h-6 text-violet-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-3">Ask which WorkflowHub workflows suit your research.</p>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="w-full text-left text-[11px] text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-2 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-50 text-gray-700 border border-gray-100"
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
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Import shortcut */}
      {messages.length > 0 && (
        <div className="px-3 pt-2">
          <button
            onClick={onOpenImporter}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors"
          >
            <Globe className="w-3 h-3" /> Search & import from WorkflowHub
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 mt-2">
        <div className="flex gap-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about workflows..."
            className="resize-none text-xs min-h-[60px] max-h-[120px]"
            rows={2}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!query.trim() || loading}
            className="bg-violet-600 hover:bg-violet-700 h-auto w-9 flex-shrink-0 self-end"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}