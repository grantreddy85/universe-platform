import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, Loader2, Plus, Pencil, Check, X, FileText, BookOpen, AlignLeft, CheckSquare, Square, Trash2 } from "lucide-react";
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
  const [showSummarizeDialog, setShowSummarizeDialog] = useState(false);
  const [selectedConvos, setSelectedConvos] = useState([]);
  const [summarizeFormat, setSummarizeFormat] = useState("research_paper");
  const [summarizeTitle, setSummarizeTitle] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [saveDestination, setSaveDestination] = useState("current");
  const [newProjectName, setNewProjectName] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  const deleteConversation = async (convoId) => {
    setConversations((prev) => prev.filter((c) => c.id !== convoId));
    if (activeConversation?.id === convoId) {
      setActiveConversation(conversations[1] || null);
      if (conversations[1]) {
        setMessages(conversations[1].messages || []);
      } else {
        setMessages([]);
      }
    }
  };

  const openSummarizeDialog = () => {
    setSelectedConvos(conversations.map((c) => c.id));
    setSummarizeTitle("");
    setSummarizeFormat("research_paper");
    setShowSummarizeDialog(true);
  };

  const toggleConvoSelection = (id) => {
    setSelectedConvos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const generateSummary = async () => {
     if (selectedConvos.length === 0 || !summarizeTitle.trim()) return;
     if (saveDestination === "new_project" && !newProjectName.trim()) return;
     setSummarizing(true);

     const selected = conversations.filter((c) => selectedConvos.includes(c.id));
     const fullConvos = await Promise.all(selected.map((c) => base44.agents.getConversation(c.id)));

     const sessionTexts = fullConvos.map((c) => {
       const msgs = (c.messages || [])
         .filter((m) => m.role !== "system")
         .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content?.replace(/\[Project Context:[\s\S]*?User Question: /s, "") || ""}`)
         .join("\n");
       return `--- Session: "${c.metadata?.name || "Session"}" ---\n${msgs}`;
     }).join("\n\n");

     const sessionNames = selected.map((c) => c.metadata?.name || "Session").join(", ");

     const prompt = summarizeFormat === "research_paper"
       ? `You are a scientific research assistant. Analyze the following AI research chat sessions (${sessionNames}) and produce a full structured research paper with these exact sections:\n\n## Introduction\nProvide scientific context, background, and the research question or problem explored in these sessions.\n\n## Methodology\nDescribe the research approaches, analytical methods, frameworks, or experimental designs discussed.\n\n## Results\nSummarize the key findings, data points, insights, and outcomes discovered across the sessions.\n\n## Discussion\nInterpret the results, discuss their significance, compare with existing knowledge, and address any limitations or uncertainties raised.\n\n## Conclusion\nProvide a concise synthesis of the research outcomes and suggest potential next steps or future research directions.\n\nFormat strictly in Markdown with these exact headings. Be detailed, scientific, and objective. Draw only from the content of the sessions.\n\n${sessionTexts}`
       : `You are a research assistant. Summarize the following AI research chat sessions (${sessionNames}) into a clear, well-structured note. Highlight the key insights, findings, hypotheses, and important information discussed. Use bullet points and short paragraphs for readability.\n\n${sessionTexts}`;

     const summary = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });

     if (saveDestination === "workspace") {
       // Save to Workspace as WorkspaceItem
       await base44.entities.WorkspaceItem.create({
         title: summarizeTitle,
         type: "note",
         content: summary,
         metadata: { source: "ai_copilot_summary" }
       });
     } else if (saveDestination === "new_project") {
       // Create new project and save note to it
       const newProj = await base44.entities.Project.create({
         title: newProjectName.trim(),
         status: "draft"
       });
       await base44.entities.Note.create({
         project_id: newProj.id,
         title: summarizeTitle,
         content: summary,
         source: "ai_copilot",
       });
       queryClient.invalidateQueries({ queryKey: ["projects"] });
     } else {
       // Save to current project
       await base44.entities.Note.create({
         project_id: project.id,
         title: summarizeTitle,
         content: summary,
         source: "ai_copilot",
       });
       queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
     }

     setShowSummarizeDialog(false);
     setSummarizing(false);
     setSaveDestination("current");
     setNewProjectName("");
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
        <div className="p-3 border-b border-gray-100 space-y-1.5">
          <Button
            onClick={() => setShowNewSessionDialog(true)}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            New Session
          </Button>
          {conversations.length > 0 && (
            <Button
              onClick={openSummarizeDialog}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-600 hover:bg-blue-50"
            >
              <FileText className="w-3 h-3 mr-1.5" />
              Summarize Sessions
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`w-full px-3 py-2 rounded-lg text-xs transition-colors group ${
                activeConversation?.id === convo.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {editingConvoId === convo.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-6 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateConversationName(convo.id, editingName);
                      } else if (e.key === "Escape") {
                        setEditingConvoId(null);
                        setEditingName("");
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => updateConversationName(convo.id, editingName)}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => {
                      setEditingConvoId(null);
                      setEditingName("");
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => switchConversation(convo)}
                    className="flex-1 text-left truncate"
                  >
                    {convo.metadata?.name || "Session"}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConvoId(convo.id);
                        setEditingName(convo.metadata?.name || "");
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Summarize Dialog */}
      <Dialog open={showSummarizeDialog} onOpenChange={setShowSummarizeDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Summarize AI Sessions into a Note</DialogTitle>
            <p className="text-xs text-gray-400 mt-0.5">Select sessions, choose a format, and generate a research note saved to this project's Notes tab.</p>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Session selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions to Include</Label>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setSelectedConvos(selectedConvos.length === conversations.length ? [] : conversations.map((c) => c.id))}
                >
                  {selectedConvos.length === conversations.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
                {conversations.map((convo) => {
                  const isSelected = selectedConvos.includes(convo.id);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => toggleConvoSelection(convo.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isSelected ? "bg-blue-50 border border-blue-200 text-blue-800" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" /> : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                      <span className="flex-1 text-left font-medium truncate">{convo.metadata?.name || "Session"}</span>
                    </button>
                  );
                })}
              </div>
              {selectedConvos.length === 0 && <p className="text-xs text-amber-600">Select at least one session to continue.</p>}
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Output Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSummarizeFormat("research_paper")}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${summarizeFormat === "research_paper" ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <BookOpen className={`w-4 h-4 mt-0.5 flex-shrink-0 ${summarizeFormat === "research_paper" ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${summarizeFormat === "research_paper" ? "text-blue-800" : "text-gray-700"}`}>Research Paper</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Intro · Methodology · Results · Discussion · Conclusion</p>
                  </div>
                </button>
                <button
                  onClick={() => setSummarizeFormat("simple_summary")}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${summarizeFormat === "simple_summary" ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <AlignLeft className={`w-4 h-4 mt-0.5 flex-shrink-0 ${summarizeFormat === "simple_summary" ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${summarizeFormat === "simple_summary" ? "text-blue-800" : "text-gray-700"}`}>Simple Summary</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Key insights and findings in plain format</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Note Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Note Title *</Label>
              <input
                value={summarizeTitle}
                onChange={(e) => setSummarizeTitle(e.target.value)}
                placeholder="e.g. Project Research Summary"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSummarizeDialog(false)}>Cancel</Button>
            <Button
              onClick={generateSummary}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
              disabled={selectedConvos.length === 0 || !summarizeTitle.trim() || summarizing}
            >
              {summarizing ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1.5" />Generate & Save to Notes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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