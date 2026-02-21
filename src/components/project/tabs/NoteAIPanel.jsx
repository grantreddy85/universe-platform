import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

export default function NoteAIPanel({ note, onClose }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userMessage = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI assistant helping a researcher analyse a note.

Note Title: "${note.title}"
Note Content:
"""
${note.content || "(empty)"}
"""

User question: ${userMessage}

Answer clearly and concisely, referencing the note content where relevant.`,
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
          <span className="text-xs font-semibold text-gray-700">Ask AI about this note</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Note context pill */}
      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-[10px] text-gray-400 truncate">
          <span className="font-medium text-gray-500">Note: </span>{note.title}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-6 h-6 text-violet-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Ask anything about this note.</p>
            <p className="text-[11px] text-gray-300 mt-1">e.g. "Summarise this note" or "What are the key findings?"</p>
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
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
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
            placeholder="Ask something..."
            className="resize-none text-xs min-h-[60px] max-h-[120px]"
            rows={2}
          />
          <Button
            size="icon"
            onClick={handleSend}
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