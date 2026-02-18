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
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-greet with section-by-section quick feedback when opened
  useEffect(() => {
    if (isOpen && !hasGreeted && linkedNote) {
      setHasGreeted(true);
      runGreeting();
    }
  }, [isOpen]);

  const systemPersona = `You are a senior scientific publication mentor — warm, direct, and encouraging. You speak conversationally, like a colleague sitting next to the researcher guiding them through getting their work published. Keep your tone human and supportive, not robotic or formal.

Rules:
- Keep responses SHORT and focused. One point at a time.
- When you spot something that needs fixing, give a brief 1-2 sentence explanation of WHY, then provide the suggested replacement text.
- Wrap ONLY the replacement text (the exact text the user should paste in) in <suggestion original="...">...</suggestion> tags, where the "original" attribute contains a short unique excerpt from the original text you're replacing (enough to find it). This is critical for the find-and-replace to work correctly.
- Never wrap general advice in suggestion tags — only concrete replacement text.
- If the user asks a question, answer it naturally and briefly.`;

  const runGreeting = async () => {
    setIsLoading(true);
    const docContent = linkedNote ? `Title: ${linkedNote.title}\n\n${linkedNote.content}` : "(no document yet)";

    const prompt = `${systemPersona}

The researcher just opened the Publication Guide. Read their document and give a warm, brief mentor-style opening — greet them, then give ONE short observation about the strongest part of their document and ONE section that needs the most attention first. Keep it to 3-4 sentences max. Make them feel supported, not overwhelmed.

Document:
${docContent}`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages([{ role: "assistant", content: response }]);
    } catch {
      setMessages([{ role: "assistant", content: "Hey! I'm here to help get this ready for publication. Ask me about any section or just say 'review my document' and I'll walk you through it." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    const docContent = linkedNote ? `Title: ${linkedNote.title}\n\n${linkedNote.content}` : "(no document)";

    const conversationHistory = history
      .map((m) => `${m.role === "user" ? "Researcher" : "Mentor"}: ${m.content}`)
      .join("\n\n");

    const prompt = `${systemPersona}

Current document:
${docContent}

Conversation so far:
${conversationHistory}

Continue as the mentor. Respond to the researcher's latest message. If you suggest a text change, use <suggestion original="short excerpt from original text being replaced">replacement text here</suggestion>.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I hit a snag there — try again?" }]);
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
          <div>
            <span className="text-sm font-semibold text-gray-900">Publication Guide</span>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Your mentor</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Opening your session...</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === "user") {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs bg-blue-600 text-white leading-relaxed">
                  {msg.content}
                </div>
              </div>
            );
          }

          // Parse assistant messages for <suggestion> tags
          const parts = msg.content.split(/(<suggestion[^>]*>[\s\S]*?<\/suggestion>)/g);
          return (
            <div key={idx} className="flex justify-start">
              <div className="max-w-[92%] space-y-2">
                {parts.map((part, pIdx) => {
                  const match = part.match(/^<suggestion(?:\s+original="([^"]*)")?>([\s\S]*?)<\/suggestion>$/);
                  if (match) {
                    const originalExcerpt = match[1] || "";
                    const suggestionText = match[2].trim();
                    const isApplied = appliedIdx.has(`${idx}-${pIdx}`);
                    const isApplying = applyingIdx === `${idx}-${pIdx}`;
                    return (
                      <div key={pIdx} className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">✏️ Suggested rewrite</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{suggestionText}</p>
                        <Button
                          size="sm"
                          disabled={isApplied || isApplying || !onApplySuggestion}
                          onClick={async () => {
                            setApplyingIdx(`${idx}-${pIdx}`);
                            await onApplySuggestion(originalExcerpt, suggestionText);
                            setAppliedIdx((prev) => new Set([...prev, `${idx}-${pIdx}`]));
                            setApplyingIdx(null);
                          }}
                          className={`w-full text-xs h-7 ${isApplied ? "bg-green-600 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"} text-white`}
                        >
                          {isApplying ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Applying...</>
                          ) : isApplied ? (
                            <><Check className="w-3 h-3 mr-1.5" />Applied</>
                          ) : (
                            <><Wand2 className="w-3 h-3 mr-1.5" />Apply to Document</>
                          )}
                        </Button>
                      </div>
                    );
                  }
                  return part.trim() ? (
                    <div key={pIdx} className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {part.trim()}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask your mentor..."
            className="text-xs"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 h-9 w-9 flex-shrink-0"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}