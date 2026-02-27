import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ServiceFormDialog from "./ServiceFormDialog";

const statusColors = {
  available: "bg-green-100 text-green-800",
  busy: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-red-100 text-red-800",
};

const categoryEmoji = {
  biological_cellular: "🧬",
  molecular_analytical: "🔬",
  protein_immunology: "💊",
  structural_chemical: "⚗️",
};

export default function ProviderServiceCard({ service, onUpdate }) {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await base44.entities.LabService.delete(service.id);
        onUpdate();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl">{categoryEmoji[service.category] || "🔬"}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{service.name}</h3>
              <Badge className={`mt-2 ${statusColors[service.status] || statusColors.available}`}>
                {service.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditForm(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{service.description}</p>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Turnaround:</span>
            <span className="font-medium text-slate-900">{service.turnaround_days} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Starting from:</span>
            <span className="font-medium text-slate-900">${service.price_from} {service.currency}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-3 h-3 mr-2" /> View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </Card>

      <ServiceFormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={onUpdate}
        initialService={service}
      />
    </>
  );
}