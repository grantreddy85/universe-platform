import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Plus, X, RotateCcw, Send, Loader2, Sparkles, Save, FileText, CheckSquare, Square, BookOpen, AlignLeft, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import UniVerseLogo from "@/components/UniVerseLogo";

const suggestions = [
  "Generate hypothesis about treatment of Haemachromatosis",
  "Generate counter hypothesis about Cervical Cancer",
  "What are the latest findings in Cancer Immunotherapy",
  "Explore antimicrobial resistance patterns in MRSA",
  "Design a cohort for Alzheimer's biomarker validation",
  "Analyse proteomic data for early disease detection"
];

export default function Search() {
  const [activeTab, setActiveTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({ projectId: "", title: "", content: "" });
  const [showSummarizeDialog, setShowSummarizeDialog] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState([]);
  const [summarizeFormat, setSummarizeFormat] = useState("research_paper");
  const [summarizing, setSummarizing] = useState(false);
  const [saveDestination, setSaveDestination] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => base44.entities.Project.list("title", 100),
  });

  // Reset to landing page when Research tab is clicked
  useEffect(() => {
    const handleReset = () => resetAll();
    const handleSwitchChat = (e) => {
      const { chatId } = e.detail;
      const tab = tabs.find((t) => t.id === chatId);
      if (tab) {
        setActiveTab(chatId);
        setMessages(tab.messages || []);
      }
    };
    window.addEventListener("research_reset", handleReset);
    window.addEventListener("research_switch_chat", handleSwitchChat);
    return () => {
      window.removeEventListener("research_reset", handleReset);
      window.removeEventListener("research_switch_chat", handleSwitchChat);
    };
  }, [tabs]);

  // Load drafts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("search_drafts");
    if (saved) {
      try {
        const drafts = JSON.parse(saved);
        if (drafts.length > 0) {
          setTabs(drafts);
          setActiveTab(drafts[0].id);
          setMessages(drafts[0].messages || []);
        }
      } catch (e) {
        console.error("Failed to load drafts:", e);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = () => {
    const newTab = {
      id: Date.now().toString(),
      name: `Chat ${tabs.length + 1}`,
      messages: [],
    };
    const updated = [...tabs, newTab];
    setTabs(updated);
    setActiveTab(newTab.id);
    setMessages([]);
    localStorage.setItem("search_drafts", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("search_drafts_updated"));
  };

  const closeTab = (tabId) => {
    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    localStorage.setItem("search_drafts", JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("search_drafts_updated"));
    if (activeTab === tabId) {
      setActiveTab(filtered.length > 0 ? filtered[0].id : null);
      setMessages(filtered.length > 0 ? filtered[0].messages : []);
    }
  };

  const resetAll = () => {
    setTabs([]);
    setActiveTab(null);
    setMessages([]);
    localStorage.setItem("search_drafts", JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("search_drafts_updated"));
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    setMessages(tab?.messages || []);
    localStorage.setItem("search_drafts", JSON.stringify(tabs));
  };

  const saveConversationToHistory = (tabName, tabMessages) => {
    const conversations = localStorage.getItem("search_conversations");
    const parsed = conversations ? JSON.parse(conversations) : [];
    const updated = [{ name: tabName, messages: tabMessages }, ...parsed.slice(0, 9)];
    localStorage.setItem("search_conversations", JSON.stringify(updated));
  };

  const handleFileAttach = async (file) => {
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAttachedFiles((prev) => [...prev, { name: file.name, url: file_url }]);
    setUploadingFile(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileAttach(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileAttach(file);
  };

  const removeAttachment = (url) => {
    setAttachedFiles((prev) => prev.filter((f) => f.url !== url));
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;
    const text = input.trim();
    const files = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);

    if (!activeTab) {
      createNewChat();
    }

    const userMessage = { role: "user", content: text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: text,
        add_context_from_internet: true,
      });

      const aiMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update tab
      setTabs((prev) => {
        const updated = prev.map((t) => (t.id === activeTab ? { ...t, messages: finalMessages } : t));
        const currentTab = updated.find((t) => t.id === activeTab);
        if (currentTab) {
          saveConversationToHistory(currentTab.name, finalMessages);
        }
        localStorage.setItem("search_drafts", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const openSaveDialog = (content) => {
    setSaveForm({ projectId: "", title: "", content });
    setShowSaveDialog(true);
  };

  const saveToProject = async () => {
    if (!saveForm.projectId || !saveForm.title.trim()) return;
    await base44.entities.Note.create({
      project_id: saveForm.projectId,
      title: saveForm.title,
      content: saveForm.content,
      source: "research_chat",
    });
    queryClient.invalidateQueries({ queryKey: ["project-notes", saveForm.projectId] });
    setShowSaveDialog(false);
    setSaveForm({ projectId: "", title: "", content: "" });
  };

  const openSummarizeDialog = () => {
    setSelectedTabs(tabs.map((t) => t.id));
    setShowSummarizeDialog(true);
  };

  const toggleTabSelection = (tabId) => {
    setSelectedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  const generateSummary = async () => {
     if (selectedTabs.length === 0 || !saveForm.title.trim() || !saveDestination) return;
     if (saveDestination === "new_project" && !newProjectName.trim()) return;
     setSummarizing(true);

     try {
       const selectedSessions = tabs.filter((t) => selectedTabs.includes(t.id));
       const selectedMessages = selectedSessions
         .map((t) => {
           const msgs = t.messages
             .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
             .join("\n");
           return `--- Session: "${t.name}" ---\n${msgs}`;
         })
         .join("\n\n");

       const sessionNames = selectedSessions.map((t) => t.name).join(", ");

       const prompt =
         summarizeFormat === "research_paper"
           ? `You are a scientific research assistant. Analyze the following AI research chat sessions (${sessionNames}) and produce a full structured research paper with these exact sections:

  ## Introduction
  Provide scientific context, background, and the research question or problem explored in these sessions.

  ## Methodology
  Describe the research approaches, analytical methods, frameworks, or experimental designs discussed.

  ## Results
  Summarize the key findings, data points, insights, and outcomes discovered across the sessions.

  ## Discussion
  Interpret the results, discuss their significance, compare with existing knowledge, and address any limitations or uncertainties raised.

  ## Conclusion
  Provide a concise synthesis of the research outcomes and suggest potential next steps or future research directions.

  Format strictly in Markdown with these exact headings. Be detailed, scientific, and objective. Draw only from the content of the sessions.

  ${selectedMessages}`
           : `You are a research assistant. Summarize the following AI research chat sessions (${sessionNames}) into a clear, well-structured note. Highlight the key insights, findings, hypotheses, and important information discussed. Use bullet points and short paragraphs for readability.

  ${selectedMessages}`;

       const summary = await base44.integrations.Core.InvokeLLM({
         prompt,
         add_context_from_internet: false,
       });

       if (saveDestination === "workspace") {
         // Save to Workspace as WorkspaceItem
         await base44.entities.WorkspaceItem.create({
           title: saveForm.title,
           type: "note",
           content: summary,
           metadata: { source: "research_chat_summary" }
         });
       } else if (saveDestination === "new_project") {
         // Create new project and save note to it
         const newProj = await base44.entities.Project.create({
           title: newProjectName.trim(),
           status: "draft"
         });
         await base44.entities.Note.create({
           project_id: newProj.id,
           title: saveForm.title,
           content: summary,
           source: "research_chat",
         });
         queryClient.invalidateQueries({ queryKey: ["projects-list"] });
       } else if (saveDestination.startsWith("project_")) {
         // Save to selected project
         const projectId = saveDestination.split("_")[1];
         await base44.entities.Note.create({
           project_id: projectId,
           title: saveForm.title,
           content: summary,
           source: "research_chat",
         });
         queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
       }

       setShowSummarizeDialog(false);
       setSaveForm({ projectId: "", title: "", content: "" });
       setSelectedTabs([]);
       setSaveDestination("");
       setNewProjectName("");
     } catch (error) {
       console.error("Failed to generate summary:", error);
     }
     setSummarizing(false);
   };

  const hasStarted = tabs.length > 0;

  if (!hasStarted) {
    // Get unique conversation names from localStorage if available
    const savedConversations = localStorage.getItem("search_conversations");
    const conversations = savedConversations ? JSON.parse(savedConversations) : [];
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 px-6">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-3">
              <UniVerseLogo className="w-12 h-12" />
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">UniVerse</h1>
            </div>
            <p className="text-sm text-gray-400">Research Infrastructure Operating System</p>
          </div>

          <div className="mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  createNewChat();
                  sendMessage();
                }
              }}
            >
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your question or topic..."
                  className="h-14 pl-5 pr-14 text-base rounded-xl border-gray-200 bg-white shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">Recent Conversations</p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {conversations.map((conv, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newTab = {
                        id: Date.now().toString(),
                        name: conv.name || `Chat ${tabs.length + 1}`,
                        messages: conv.messages || [],
                      };
                      setTabs([...tabs, newTab]);
                      setActiveTab(newTab.id);
                      setMessages(conv.messages || []);
                    }}
                    className="w-full text-left px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 hover:text-gray-900 truncate"
                  >
                    {conv.name || "Untitled Conversation"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">Start with a suggestion</p>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                    createNewChat();
                    setTimeout(() => {
                      setInput(suggestion);
                      sendMessage();
                    }, 100);
                  }}
                  className="w-full text-left px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 hover:text-gray-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 mr-4 pr-4 border-r border-gray-200">
            <UniVerseLogo className="w-6 h-6" />
            <span className="text-sm font-semibold text-gray-900">UniVerse</span>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="hover:bg-gray-200 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}
          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
          <button
            onClick={openSummarizeDialog}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Summarize Sessions
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-400">Hi! I'm your AI assistant. How can I help you today?</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-100 text-gray-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      <ReactMarkdown className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content || ""}
                      </ReactMarkdown>
                      <button
                        onClick={() => openSaveDialog(msg.content)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <Save className="w-3 h-3" />
                        Save to Project
                      </button>
                    </>
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
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-4xl mx-auto">
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
              placeholder="Type your message..."
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
            <p className="text-xs text-gray-400 mt-0.5">Select sessions, choose a format, and generate an editable research note saved to your project.</p>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Session selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions to Include</Label>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() =>
                    setSelectedTabs(
                      selectedTabs.length === tabs.length ? [] : tabs.map((t) => t.id)
                    )
                  }
                >
                  {selectedTabs.length === tabs.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
                {tabs.map((tab) => {
                  const isSelected = selectedTabs.includes(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => toggleTabSelection(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isSelected
                          ? "bg-blue-50 border border-blue-200 text-blue-800"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className="flex-1 text-left font-medium">{tab.name}</span>
                      <span className="text-xs text-gray-400">{tab.messages.length} messages</span>
                    </button>
                  );
                })}
              </div>
              {selectedTabs.length === 0 && (
                <p className="text-xs text-amber-600">Select at least one session to continue.</p>
              )}
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Output Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSummarizeFormat("research_paper")}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    summarizeFormat === "research_paper"
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 mt-0.5 flex-shrink-0 ${summarizeFormat === "research_paper" ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${summarizeFormat === "research_paper" ? "text-blue-800" : "text-gray-700"}`}>Research Paper</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Intro · Methodology · Results · Discussion · Conclusion</p>
                  </div>
                </button>
                <button
                  onClick={() => setSummarizeFormat("simple_summary")}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    summarizeFormat === "simple_summary"
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <AlignLeft className={`w-4 h-4 mt-0.5 flex-shrink-0 ${summarizeFormat === "simple_summary" ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${summarizeFormat === "simple_summary" ? "text-blue-800" : "text-gray-700"}`}>Simple Summary</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Key insights and findings in plain format</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Save to Project */}
             <div className="space-y-1.5">
               <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Save to Project *</Label>
               <select
                 value={saveDestination}
                 onChange={(e) => setSaveDestination(e.target.value)}
                 className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white"
               >
                 <option value="">Select project</option>
                 {projects.map((proj) => (
                   <option key={proj.id} value={`project_${proj.id}`}>
                     {proj.title}
                   </option>
                 ))}
                 <option value="workspace">Workspace</option>
                 <option value="new_project">+ Create New Project</option>
               </select>
             </div>

             {/* New Project Name */}
             {saveDestination === "new_project" && (
               <div className="space-y-1.5">
                 <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project Name *</Label>
                 <Input
                   value={newProjectName}
                   onChange={(e) => setNewProjectName(e.target.value)}
                   placeholder="e.g. MRSA Resistance Analysis"
                   className="text-sm"
                 />
               </div>
             )}

             {/* Note Title */}
             <div className="space-y-1.5">
               <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Note Title *</Label>
               <Input
                 value={saveForm.title}
                 onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })}
                 placeholder="e.g. MRSA Resistance Review"
                 className="text-sm"
               />
             </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSummarizeDialog(false)}>
              Cancel
            </Button>
            <Button
               onClick={generateSummary}
               size="sm"
               className="bg-blue-600 hover:bg-blue-700 text-xs"
               disabled={selectedTabs.length === 0 || !saveForm.title.trim() || !saveDestination || (saveDestination === "new_project" && !newProjectName.trim()) || summarizing}
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

      {/* Save single message Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Save to Project Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Project *</Label>
              <Select value={saveForm.projectId} onValueChange={(v) => setSaveForm({ ...saveForm, projectId: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Note Title *</Label>
              <Input
                value={saveForm.title}
                onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })}
                placeholder="Title for this note"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveToProject}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
              disabled={!saveForm.projectId || !saveForm.title.trim()}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}