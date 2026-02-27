import React from "react";
import { Clock, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_IMAGES = {
  biological: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80",
  molecular: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&q=80",
  protein: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  structural: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400&q=80",
  default: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&q=80"
};



export default function LabServiceCard({ service, categoryMeta, onRequest }) {
  const statusLabel = service.status?.replace("_", " ") || "available";

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden flex flex-col">
      {/* Image */}
      {service.image_url ?
      <div className="h-40 bg-gray-50 overflow-hidden">
          <img
          src={service.image_url}
          alt={service.name}
          className="w-full h-full object-cover" />

        </div> :

      <div className="h-40 bg-gray-100 overflow-hidden">
          <img
          src={CATEGORY_IMAGES[categoryMeta?.label?.split(" ")[0]?.toLowerCase()] || CATEGORY_IMAGES.default}
          alt={service.name}
          className="w-full h-full object-cover opacity-80" />

        </div>
      }

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{service.name}</h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0`}
          style={{
            backgroundColor: service.status === 'available' ? 'var(--color-status-validated-bg)' : service.status === 'busy' ? 'var(--color-status-validation-bg)' : '#fee2e2',
            color: service.status === 'available' ? 'var(--color-status-validated-text)' : service.status === 'busy' ? 'var(--color-status-validation-text)' : '#991b1b'
          }}>
            {statusLabel}
          </span>
        </div>

        <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--color-neutral-500)' }}>
          {service.description}
        </p>

        {/* Capabilities */}
        {service.capabilities?.length > 0 &&
        <div className="flex flex-wrap gap-1 mb-3">
            {service.capabilities.slice(0, 3).map((cap, i) =>
          <span key={i} className="text-[10px] rounded px-1.5 py-0.5" style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)', border: '1px solid var(--color-neutral-100)' }}>
                {cap}
              </span>
          )}
            {service.capabilities.length > 3 &&
          <span className="text-[10px]" style={{ color: 'var(--color-neutral-400)' }}>+{service.capabilities.length - 3} more</span>
          }
          </div>
        }

        <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-neutral-100)' }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-neutral-400)' }}>
            {service.turnaround_days &&
            <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {service.turnaround_days}d turnaround
              </span>
            }
            {service.price_from &&
            <span className="font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--color-neutral-500)' }}>
                From ${service.price_from}
              </span>
            }
          </div>
          <Button
            size="sm"
            className="h-8 text-xs text-white"
            style={{ backgroundColor: 'var(--color-interactive-blue)', ':hover': { backgroundColor: 'var(--color-interactive-blue-dark)' } }}
            disabled={service.status === "maintenance"}
            onClick={onRequest}>
            Request
          </Button>
        </div>
      </div>
    </div>);

}