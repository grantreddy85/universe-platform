import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MoreHorizontal, Trash2, Edit2, Globe, Lock, AlertCircle, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-blue-50 text-blue-600",
  validation: "bg-amber-50 text-amber-600",
  validated: "bg-emerald-50 text-emerald-600",
  tokenised: "bg-violet-50 text-violet-600",
};

export default function ProjectHeader({ project, onProjectUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [editedDescription, setEditedDescription] = useState(project.description || "");
  const [visibility, setVisibility] = useState(project.visibility_setting || "private");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: user?.email }, "-created_date", 1),
    enabled: !!user?.email,
  });

  const currentPlan = subscription?.[0]?.plan || "trial";
  const supportsPrivate = ["pro"].includes(currentPlan);

  const handleUpdateDescription = async () => {
    await base44.entities.Project.update(project.id, {
      description: editedDescription,
    });
    queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    onProjectUpdated?.();
    setEditOpen(false);
  };

  const handleDeleteProject = async () => {
    await base44.entities.Project.delete(project.id);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    navigate(createPageUrl("Projects"));
  };

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === "private" ? "platform_shared" : "private";
    await base44.entities.Project.update(project.id, {
      visibility_setting: newVisibility,
    });
    setVisibility(newVisibility);
    queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="border-b border-gray-100 bg-white px-6 lg:px-10 py-5">
      <Link
        to={createPageUrl("Projects")}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3"
      >
        <ChevronLeft className="w-3 h-3" />
        Projects
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {project.title}
            </h1>
            <Badge
              variant="secondary"
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 ${
                statusStyles[project.status] || statusStyles.draft
              }`}
            >
              {project.status || "draft"}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            className="text-xs h-8 px-3 flex items-center gap-1.5"
          >
            {visibility === "private" ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                Private
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                Public
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit2 className="w-3.5 h-3.5 mr-2" />
                Edit Description
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Description Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="mt-2"
                rows={4}
                placeholder="Enter project description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDescription}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}