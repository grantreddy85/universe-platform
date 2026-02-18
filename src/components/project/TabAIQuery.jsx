import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, X, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function TabAIQuery({ project, activeTab, open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTabContext = async () => {
    try {
      const contexts = {
        notes: await base44.entities.Note.filter({ project_id: project.id }),
        vault: await base44.entities.ProjectDocument.filter({ project_id: project.id }),
        cohorts: await base44.entities.Cohort.filter({ project_id: project.id }),
        workflows: await base44.entities.Workflow.filter({ project_id: project.id }),
        validation: await base44.entities.ValidationRequest.filter({ project_id: project.id }),
        assets: await base44.entities.Asset.filter({ project_id: project.id }),
      };
      return contexts[activeTab] || [];
    } catch (e) {
      return [];
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const tabData = await getTabContext();
      const tabLabel = {
        notes: "Notes & Findings",
        vault: "Vault Documents",
        cohorts: "Cohorts",
        workflows: "Workflows",
        validation: "Validations",
        assets: "Assets",
      }[activeTab] || activeTab;

      const prompt = `You are helping analyze research data in the ${tabLabel} section of a project titled "${project.title}".

${tabLabel} Data:
${JSON.stringify(tabData, null, 2)}

User Query: ${userMessage}

Provide a concise, actionable analysis specific to this section of the project.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to process query. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Query
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              <p className="mb-2">Ask questions about the data in this section</p>
              <p className="text-[11px]">e.g., "Summarize all notes", "What patterns do you see?"</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-700 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 pt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this section..."
            className="text-xs h-9"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}