import React from "react";
import { FlaskConical, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabsTab({ project }) {
  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-7 h-7 text-teal-500" strokeWidth={1.6} />
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Lab Experiments</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
          Lab experiments and physical results for <span className="font-medium text-gray-600">{project?.title}</span> will appear here. Once connected, you'll be able to query lab results alongside your in-silico data.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-xs font-medium mb-6">
          <Clock className="w-3.5 h-3.5" />
          Coming Soon
        </div>
        <div className="border-t border-gray-100 pt-6 text-left space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned features</p>
          {[
            "Link physical lab experiments to this project",
            "Import results from third-party lab partners",
            "Query lab results alongside cohort & workflow data",
            "Unified validation across in-silico and wet lab",
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-300 mt-1.5 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}