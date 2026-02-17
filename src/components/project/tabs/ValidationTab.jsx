import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ValidationTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "in_silico" });
  const queryClient = useQueryClient();

  const { data: validations = [], isLoading } = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () =>
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ValidationRequest.create({ ...data, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
      setShowNew(false);
      setForm({ title: "", type: "in_silico" });
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Validation</h2>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Validation
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : validations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No validations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {validations.map((v) => (
            <div key={v.id} className="bg-white rounded-lg border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900">{v.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{v.type}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Validation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) return;
              createMutation.mutate(form);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Validation title"
                className="text-sm"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs"
                disabled={!form.title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}