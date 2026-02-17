import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, RotateCcw, Send, Loader2, Sparkles, Save, FileText } from "lucide-react";
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
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => base44.entities.Project.list("title", 100),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = () => {
    const newTab = {
      id: Date.now().toString(),
      name: `Chat ${tabs.length + 1}`,
      messages: [],
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setMessages([]);
  };

  const closeTab = (tabId) => {
    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    if (activeTab === tabId) {
      setActiveTab(filtered.length > 0 ? filtered[0].id : null);
      setMessages(filtered.length > 0 ? filtered[0].messages : []);
    }
  };

  const resetAll = () => {
    setTabs([]);
    setActiveTab(null);
    setMessages([]);
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    setMessages(tab?.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

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
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab ? { ...t, messages: finalMessages } : t))
      );
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
    if (selectedTabs.length === 0 || !saveForm.projectId) return;
    setSummarizing(true);

    try {
      const selectedMessages = tabs
        .filter((t) => selectedTabs.includes(t.id))
        .flatMap((t) =>
          t.messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
        )
        .join("\n\n");

      const prompt =
        summarizeFormat === "research_paper"
          ? `You are a scientific research assistant. Analyze the following AI research chat sessions and create a structured research paper summary with the following sections:

**Introduction**: Provide context and background for the research topic discussed.
**Methodology**: Describe the research approach, methods, or frameworks mentioned.
**Results**: Summarize key findings, data, or insights discovered.
**Discussion**: Interpret the results, discuss implications, and address limitations.
**Conclusion**: Provide a concise summary of the research outcomes and potential future directions.

Format the output in Markdown with clear section headings. Be detailed, scientific, and objective.

Chat Sessions:
${selectedMessages}`
          : `Summarize the following AI research chat sessions into a clear, concise, and well-structured note. Highlight key insights, findings, and important information discussed.

Chat Sessions:
${selectedMessages}`;

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      setSaveForm({ ...saveForm, content: summary });
      setShowSummarizeDialog(false);
      setShowSaveDialog(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }
    setSummarizing(false);
  };

  const hasStarted = tabs.length > 0;

  if (!hasStarted) {
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

          <div className="space-y-2.5">
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Summarize AI Sessions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Select Sessions to Include</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {tabs.map((tab) => (
                  <label key={tab.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTabs.includes(tab.id)}
                      onChange={() => toggleTabSelection(tab.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tab.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {tab.messages.length} messages
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Output Format</Label>
              <Select value={summarizeFormat} onValueChange={setSummarizeFormat}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research_paper">Research Paper Format</SelectItem>
                  <SelectItem value="simple_summary">Simple Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Save to Project *</Label>
              <Select
                value={saveForm.projectId}
                onValueChange={(v) => setSaveForm({ ...saveForm, projectId: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSummarizeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateSummary}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
              disabled={selectedTabs.length === 0 || !saveForm.projectId || summarizing}
            >
              {summarizing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Save to Project</DialogTitle>
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
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
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