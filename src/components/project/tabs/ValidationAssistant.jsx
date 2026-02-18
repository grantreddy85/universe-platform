import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Loader2, Sparkles, Check, Wand2 } from "lucide-react";

export default function ValidationAssistant({ validation, linkedNote, isOpen, onToggle, onApplySuggestion }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applyingIdx, setApplyingIdx] = useState(null);
  const [appliedIdx, setAppliedIdx] = useState(new Set());
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

    const context = linkedNote
      ? `\n\nValidation Document Content:\nTitle: ${linkedNote.title}\n\nContent:\n${linkedNote.content}`
      : "";

    const prompt = `You are an expert research publication guide. Help the user refine their validation document for publication.

When providing feedback, consider this scientific research workflow:

**Research Process Flowchart:**
1. **Observation & Problem Detection** → Identify research gap or question
2. **Formulate Hypothesis** → State testable predictions and null hypothesis
3. **Comprehensive Planning** → Define experimental design, cohorts, analysis methods (iterative)
4. **Execute Experiments** → Conduct data collection with quality controls
5. **Raw Data Sets** → Document and validate raw data
6. **Execute Analyses** → Perform statistical/computational analysis
7. **Processed Results Sets** → Validate and document processed results
8. **Integrate & Interpret Results** → Synthesize findings across experiments
9. **Summary Results** → Consolidate key findings
10. **Draw Conclusions** → Interpret implications and hypothesis decision
11. **Disseminate Artifacts** → Prepare publication-ready materials
12. **Published Artifacts** → Share with scientific community
13. **Scientific Corpus** → Contribute to broader knowledge base

**Additional Considerations:**
- The planning phase is iterative: analysis methods should inform data collection design and vice versa
- Reproducibility requires clear documentation of methods, parameters, and quality controls
- Results interpretation should connect to existing literature and research context

User's document:${context}

User question: ${input}

Provide concise, actionable feedback grounded in this scientific methodology. Reference which stage(s) of the research process the document addresses and suggest improvements for clarity, rigor, and completeness in the context of publication standards.

IMPORTANT: If your response includes a concrete suggested edit or rewrite of the document (or a section of it), wrap ONLY that suggested text block in <suggestion>...</suggestion> tags. Only use this tag when you have a specific text the user can directly apply to their document. Do not wrap general advice in suggestion tags.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't generate a response. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-100 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Publication Guide</span>
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
              Ask me anything about refining your validation document for publication.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 space-y-2">
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