import React from "react";
import { Clock, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_STYLES = {
  available: "bg-emerald-50 text-emerald-600",
  busy: "bg-amber-50 text-amber-600",
  maintenance: "bg-red-50 text-red-500",
};

export default function LabServiceCard({ service, categoryMeta, onRequest }) {
  const statusLabel = service.status?.replace("_", " ") || "available";

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden flex flex-col">
      {/* Image */}
      {service.image_url ? (
        <div className="h-40 bg-gray-50 overflow-hidden">
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`h-40 flex items-center justify-center border-b border-gray-50 ${categoryMeta.color.split(" ").slice(0,1).join(" ")} bg-opacity-30`}>
          <span className="text-4xl opacity-20">⚗️</span>
        </div>
      )}

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-800 leading-snug">{service.name}</h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[service.status] || STATUS_STYLES.available}`}>
            {statusLabel}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
          {service.description}
        </p>

        {/* Capabilities */}
        {service.capabilities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {service.capabilities.slice(0, 3).map((cap, i) => (
              <span key={i} className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 rounded px-1.5 py-0.5">
                {cap}
              </span>
            ))}
            {service.capabilities.length > 3 && (
              <span className="text-[10px] text-gray-400">+{service.capabilities.length - 3} more</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {service.turnaround_days && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {service.turnaround_days}d turnaround
              </span>
            )}
            {service.price_from && (
              <span className="text-gray-500 font-medium">
                From ${service.price_from}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={service.status === "maintenance"}
            onClick={onRequest}
          >
            Request
          </Button>
        </div>
      </div>
    </div>
  );
}