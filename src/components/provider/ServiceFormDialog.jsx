import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { value: "biological_cellular", label: "Biological & Cellular" },
  { value: "molecular_analytical", label: "Molecular & Analytical" },
  { value: "protein_immunology", label: "Protein & Immunology" },
  { value: "structural_chemical", label: "Structural & Chemical" },
];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "maintenance", label: "Maintenance" },
];

export default function ServiceFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialService = null,
  userEmail = null,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    capabilities: "",
    turnaround_days: 5,
    price_from: "",
    currency: "USD",
    status: "available",
    image_url: "",
    payment_preference: "cash",
    equity_percentage: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialService) {
      setFormData({
        ...initialService,
        capabilities: Array.isArray(initialService.capabilities)
          ? initialService.capabilities.join(", ")
          : initialService.capabilities || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        description: "",
        capabilities: "",
        turnaround_days: 5,
        price_from: "",
        currency: "USD",
        status: "available",
        image_url: "",
      });
    }
  }, [initialService, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        turnaround_days: parseInt(formData.turnaround_days),
        price_from: parseFloat(formData.price_from),
        capabilities: formData.capabilities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        managed_by: userEmail,
      };

      if (initialService?.id) {
        await base44.entities.LabService.update(initialService.id, payload);
      } else {
        await base44.entities.LabService.create(payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialService ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            {initialService
              ? "Update your service details"
              : "Add a new lab service to your offerings"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., DNA Sequencing"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your service"
              required
            />
          </div>

          <div>
            <Label htmlFor="capabilities">
              Capabilities (comma-separated)
            </Label>
            <Textarea
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) =>
                setFormData({ ...formData, capabilities: e.target.value })
              }
              placeholder="e.g., High-throughput, Real-time analysis"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="turnaround">Turnaround (days) *</Label>
              <Input
                id="turnaround"
                type="number"
                min="1"
                value={formData.turnaround_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    turnaround_days: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Starting Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_from}
                onChange={(e) =>
                  setFormData({ ...formData, price_from: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                placeholder="USD"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}