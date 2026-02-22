import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import VisibilitySelector from "./VisibilitySelector";

export default function NewProjectDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ title: "", description: "", field: "", visibility_setting: "platform_shared" });
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setSubscribed(u?.subscription_status === "subscribed")).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. MRSA Resistance in Hajj Pilgrims"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Research Field</Label>
            <Input
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              placeholder="e.g. Microbiology, Genomics"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief overview of research objectives..."
              className="text-sm h-24 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Visibility</Label>
            <VisibilitySelector
              value={form.visibility_setting}
              onChange={(v) => setForm({ ...form, visibility_setting: v })}
              subscribed={subscribed}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
              disabled={!form.title.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}