import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

export default function OverviewAIChat({ project }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    init();
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const init = async () => {
    setInitLoading(true);
    const convos = await base44.agents.listConversations({ agent_name: "research_copilot" });
    // Look for an overview-specific convo for this project
    const overviewConvo = convos.find(
      (c) => c.metadata?.project_id === project.id && c.metadata?.overview === true
    );
    if (overviewConvo) {
      const full = await base44.agents.getConversation(overviewConvo.id);
      setConversation(full);
      setMessages(full.messages || []);
    }
    setInitLoading(false);
  };

  const ensureConversation = async () => {
    if (conversation) return conversation;
    const convo = await base44.agents.createConversation({
      agent_name: "research_copilot",
      metadata: {
        name: `${project.title} — Overview`,
        project_id: project.id,
        overview: true,
      },
    });
    setConversation(convo);
    return convo;
  };

  const buildContext = async (text) => {
    const [notes, hypotheses, cohorts, workflows, validations, assets] = await Promise.all([
      base44.entities.Note.filter({ project_id: project.id }, "-created_date", 30),
      base44.entities.Hypothesis.filter({ project_id: project.id }, "-created_date", 30),
      base44.entities.Cohort.filter({ project_id: project.id }, "-created_date", 30),
      base44.entities.Workflow.filter({ project_id: project.id }, "-created_date", 30),
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 30),
      base44.entities.Asset.filter({ project_id: project.id }, "-created_date", 30),
    ]);

    let ctx = `[Project: "${project.title}" | Field: ${project.field || "N/A"} | Status: ${project.status}]\n`;
    if (project.description) ctx += `Description: ${project.description}\n`;
    ctx += "\n";
    if (notes.length) ctx += `NOTES (${notes.length}): ${notes.map(n => `"${n.title}": ${n.content?.substring(0, 150) || ""}`).join("; ")}\n`;
    if (hypotheses.length) ctx += `HYPOTHESES (${hypotheses.length}): ${hypotheses.map(h => `"${h.title}" [${h.status}]`).join("; ")}\n`;
    if (cohorts.length) ctx += `COHORTS (${cohorts.length}): ${cohorts.map(c => `"${c.name}" organism=${c.organism || "N/A"}`).join("; ")}\n`;
    if (workflows.length) ctx += `WORKFLOWS (${workflows.length}): ${workflows.map(w => `"${w.title}" [${w.status}]`).join("; ")}\n`;
    if (validations.length) ctx += `VALIDATIONS (${validations.length}): ${validations.map(v => `"${v.title}" [${v.status}]`).join("; ")}\n`;
    if (assets.length) ctx += `ASSETS (${assets.length}): ${assets.map(a => `"${a.title}" [${a.status}]`).join("; ")}\n`;
    ctx += `\nUser Question: ${text}`;
    return ctx;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    const convo = await ensureConversation();
    const contextStr = await buildContext(text);

    const unsubscribe = base44.agents.subscribeToConversation(convo.id, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.[data.messages.length - 1];
      if (last?.role === "assistant" && last.content) setLoading(false);
    });

    await base44.agents.addMessage(convo, { role: "user", content: contextStr });
    setTimeout(() => unsubscribe(), 60000);
  };

  const clearChat = async () => {
    const convo = await base44.agents.createConversation({
      agent_name: "research_copilot",
      metadata: { name: `${project.title} — Overview`, project_id: project.id, overview: true },
    });
    setConversation(convo);
    setMessages([]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Project AI Assistant</span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {initLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="w-6 h-6 text-blue-200 mb-3" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Ask anything about this project — hypotheses, cohorts, notes, validations, and more. I have full context.
            </p>
            <div className="mt-4 space-y-1.5 w-full">
              {[
                "Summarise this project's key findings",
                "What hypotheses are still unvalidated?",
                "What should the next steps be?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages
            .filter((m) => m.role !== "system")
            .map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-50 border border-gray-100 text-gray-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content?.replace(/\[Project:[\s\S]*?User Question: /s, "")}
                    </p>
                  ) : (
                    <ReactMarkdown className="prose prose-xs prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content || ""}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this project..."
            className="flex-1 text-xs h-8 bg-gray-50 border-gray-200"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            disabled={!input.trim() || loading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}