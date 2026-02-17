import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Loader2, Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AITab({ project }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [editingConvoId, setEditingConvoId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setInitLoading(true);
    const convos = await base44.agents.listConversations({
      agent_name: "research_copilot",
    });
    const projectConvos = convos.filter(
      (c) => c.metadata?.project_id === project.id
    );
    setConversations(projectConvos);
    if (projectConvos.length > 0) {
      const latest = projectConvos[0];
      setActiveConversation(latest);
      setMessages(latest.messages || []);
    }
    setInitLoading(false);
  };

  const createNewChat = async (customName) => {
    const convo = await base44.agents.createConversation({
      agent_name: "research_copilot",
      metadata: {
        name: customName || `${project.title} — Session`,
        project_id: project.id,
      },
    });
    setConversations((prev) => [convo, ...prev]);
    setActiveConversation(convo);
    setMessages([]);
    setShowNewSessionDialog(false);
    setNewSessionName("");
  };

  const updateConversationName = async (convoId, newName) => {
    if (!newName.trim()) return;
    await base44.agents.updateConversation(convoId, {
      metadata: {
        name: newName.trim(),
        project_id: project.id,
      },
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === convoId ? { ...c, metadata: { ...c.metadata, name: newName.trim() } } : c))
    );
    if (activeConversation?.id === convoId) {
      setActiveConversation((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, name: newName.trim() },
      }));
    }
    setEditingConvoId(null);
    setEditingName("");
  };

  const switchConversation = async (convo) => {
    const full = await base44.agents.getConversation(convo.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    let convo = activeConversation;
    if (!convo) {
      await createNewChat();
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    // Fetch all project data for context
    const [notes, documents, hypotheses, cohorts, workflows, validations, assets] = await Promise.all([
      base44.entities.Note.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.ProjectDocument.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.Hypothesis.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.Cohort.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.Workflow.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 50),
      base44.entities.Asset.filter({ project_id: project.id }, "-created_date", 50),
    ]);

    // Build context string
    let contextStr = `[Project Context: "${project.title}"]\n`;
    contextStr += `Description: ${project.description || "No description"}\n`;
    contextStr += `Field: ${project.field || "Unspecified"}\n`;
    contextStr += `Status: ${project.status}\n\n`;

    if (notes.length > 0) {
      contextStr += `=== NOTES (${notes.length}) ===\n`;
      notes.forEach(n => contextStr += `- "${n.title}": ${n.content?.substring(0, 200) || 'No content'}...\n`);
      contextStr += `\n`;
    }

    if (hypotheses.length > 0) {
      contextStr += `=== HYPOTHESES (${hypotheses.length}) ===\n`;
      hypotheses.forEach(h => contextStr += `- "${h.title}": ${h.description?.substring(0, 150) || 'No description'}, Status: ${h.status}\n`);
      contextStr += `\n`;
    }

    if (cohorts.length > 0) {
      contextStr += `=== COHORTS (${cohorts.length}) ===\n`;
      cohorts.forEach(c => contextStr += `- "${c.name}": Organism=${c.organism || 'N/A'}, Strain=${c.strain || 'N/A'}, Sample Size=${c.sample_size || 'N/A'}, Status: ${c.status}\n`);
      contextStr += `\n`;
    }

    if (workflows.length > 0) {
      contextStr += `=== WORKFLOWS (${workflows.length}) ===\n`;
      workflows.forEach(w => contextStr += `- "${w.title}": Type=${w.type}, Status=${w.status}, ${w.results_summary ? 'Results: ' + w.results_summary.substring(0, 150) : 'No results yet'}\n`);
      contextStr += `\n`;
    }

    if (documents.length > 0) {
      contextStr += `=== VAULT DOCUMENTS (${documents.length}) ===\n`;
      documents.forEach(d => contextStr += `- "${d.title}": ${d.file_type}, ${d.summary ? 'Summary: ' + d.summary.substring(0, 150) : 'No summary'}...\n`);
      contextStr += `\n`;
    }

    if (validations.length > 0) {
      contextStr += `=== VALIDATIONS (${validations.length}) ===\n`;
      validations.forEach(v => contextStr += `- "${v.title}": Type=${v.type}, Status=${v.status}, Reproducibility=${v.reproducibility_score || 'N/A'}\n`);
      contextStr += `\n`;
    }

    if (assets.length > 0) {
      contextStr += `=== ASSETS (${assets.length}) ===\n`;
      assets.forEach(a => contextStr += `- "${a.title}": Type=${a.type}, Status=${a.status}\n`);
      contextStr += `\n`;
    }

    contextStr += `User Question: ${text}`;

    const unsubscribe = base44.agents.subscribeToConversation(
      convo.id,
      (data) => {
        setMessages(data.messages || []);
        const lastMsg = data.messages?.[data.messages.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.content) {
          setLoading(false);
        }
      }
    );

    await base44.agents.addMessage(convo, {
      role: "user",
      content: contextStr,
    });

    setTimeout(() => unsubscribe(), 60000);
  };

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)]">
      {/* Sidebar - Conversations */}
      <div className="w-56 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-3 border-b border-gray-100">
          <Button
            onClick={() => setShowNewSessionDialog(true)}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            New Session
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => switchConversation(convo)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${
                activeConversation?.id === convo.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {convo.metadata?.name || "Session"}
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-6 px-2">
              Start a conversation with your AI Co-Pilot.
            </p>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                AI Research Co-Pilot
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Ask me to generate hypotheses, analyse your vault documents, design cohorts, or explore research directions for this project.
              </p>
            </div>
          )}
          {messages
            .filter((m) => m.role !== "system")
            .map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-100 text-gray-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content?.replace(/\[Project Context:[\s\S]*?User Question: /s, "")}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content || ""}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your research co-pilot..."
              className="flex-1 text-sm h-10 bg-gray-50 border-gray-200"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 bg-blue-600 hover:bg-blue-700"
              disabled={!input.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Session</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createNewChat(newSessionName.trim() || undefined);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Session Name</Label>
              <Input
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`${project.title} — Session`}
                className="text-sm"
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewSessionDialog(false);
                  setNewSessionName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                Create Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}