import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const suggestions = [
  "Generate hypothesis about treatment of Haemachromatosis",
  "Generate counter hypothesis about Cervical Cancer",
  "What are the latest findings in Cancer Immunotherapy",
  "Explore antimicrobial resistance patterns in MRSA",
  "Design a cohort for Alzheimer's biomarker validation",
  "Analyse proteomic data for early disease detection"
];

export default function Search() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    // For now, redirect to Home - later this could trigger AI search or project creation
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 px-6">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              UniVerse
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Research Infrastructure Operating System
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
          >
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your question or topic..."
                className="h-14 pl-5 pr-14 text-base rounded-xl border-gray-200 bg-white shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
              >
                <SearchIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        </div>

        {/* Suggestions */}
        <div className="space-y-2.5">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(suggestion)}
              className="w-full text-left px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 hover:text-gray-900"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            Go to Dashboard
          </Button>
          <span className="text-gray-200">•</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => navigate(createPageUrl("Projects"))}
          >
            View Projects
          </Button>
        </div>
      </div>
    </div>
  );
}