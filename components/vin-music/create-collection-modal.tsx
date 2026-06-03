"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollectionsStore } from "@/store/collections-store";
import { useCreatePlaylist } from "@/src/lib/query/hooks";
import { toast } from "sonner";

const dialogFooterClass =
  "border-0 bg-transparent p-0 pt-1 -mx-0 -mb-0 gap-2 sm:justify-end";

export function CreateCollectionModal() {
  const isCreateModalOpen = useCollectionsStore(
    (state) => state.isCreateModalOpen,
  );
  const setCreateModalOpen = useCollectionsStore(
    (state) => state.setCreateModalOpen,
  );

  const createPlaylist = useCreatePlaylist();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleOpenChange = (open: boolean) => {
    setCreateModalOpen(open);
    if (!open) {
      setName("");
      setDescription("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createPlaylist.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create playlist.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your music.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-col-name">Collection name</Label>
            <Input
              id="create-col-name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Lofi Vibes, Gym Mix..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-col-desc">Description (optional)</Label>
            <Textarea
              id="create-col-desc"
              placeholder="Describe your collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className={dialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createPlaylist.isPending}>
              {createPlaylist.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
