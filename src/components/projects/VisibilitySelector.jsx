import React from "react";
import { Globe, Lock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function VisibilitySelector({ value, onChange, plan = "trial" }) {
  const supportsPrivate = ["pro"].includes(plan);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange("platform_shared")}
        className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
          value === "platform_shared"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          value === "platform_shared" ? "bg-blue-100" : "bg-gray-100"
        }`}>
          <Globe className={`w-4 h-4 ${value === "platform_shared" ? "text-blue-600" : "text-gray-500"}`} />
        </div>
        <div>
          <p className={`text-xs font-semibold ${value === "platform_shared" ? "text-blue-700" : "text-gray-700"}`}>
            Share with UniVerse Ecosystem
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Free. Your vault & assets contribute to multidisciplinary platform research. You may be included in larger collaborative projects.
          </p>
        </div>
        <div className={`ml-auto flex-shrink-0 mt-1 w-4 h-4 rounded-full border-2 ${
          value === "platform_shared" ? "border-blue-500 bg-blue-500" : "border-gray-300"
        } flex items-center justify-center`}>
          {value === "platform_shared" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          if (supportsPrivate) {
            onChange("private");
          }
        }}
        disabled={!supportsPrivate}
        className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
          value === "private"
            ? "border-gray-700 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        } ${!supportsPrivate ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          value === "private" ? "bg-gray-200" : "bg-gray-100"
        }`}>
          <Lock className={`w-4 h-4 ${value === "private" ? "text-gray-700" : "text-gray-500"}`} />
        </div>
        <div>
          <p className={`text-xs font-semibold ${value === "private" ? "text-gray-800" : "text-gray-700"}`}>
            Keep Private
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {supportsPrivate
              ? "Pro plan active. Your data stays fully private."
              : "Requires Pro plan. Your vault & assets remain entirely private."}
          </p>
          {!supportsPrivate && (
            <div className="flex items-start gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-amber-600 font-medium">Pro plan required</p>
                <Link to={createPageUrl("Pricing")} className="text-[11px] text-blue-600 hover:underline">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className={`ml-auto flex-shrink-0 mt-1 w-4 h-4 rounded-full border-2 ${
          value === "private" ? "border-gray-700 bg-gray-700" : "border-gray-300"
        } flex items-center justify-center ${!supportsPrivate ? "opacity-50" : ""}`}>
          {value === "private" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
      </button>
    </div>
  );
}