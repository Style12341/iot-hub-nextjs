"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateFirmwareDescriptionAction } from "@/app/actions/firmwareActions";
import { FirmwareType } from "@/lib/contexts/firmwareContext";
import { Pencil } from "lucide-react";

interface FirmwareDescriptionDialogProps {
  deviceId: string;
  firmware: FirmwareType;
  onUpdate?: (updatedFirmware: FirmwareType) => void;
  children?: React.ReactNode;
}

export function FirmwareDescriptionDialog({
  deviceId,
  firmware,
  onUpdate,
  children,
}: FirmwareDescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(firmware.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (description.trim() === firmware.description) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateFirmwareDescriptionAction(
        deviceId,
        firmware.id,
        description.trim()
      );

      if (result.success) {
        toast.success("Firmware description updated");
        if (onUpdate && result.data) {
          onUpdate(result.data);
        }
        setOpen(false);
      } else {
        toast.error("Failed to update description", {
          description: result.message
        });
      }
    } catch (error) {
      console.error("Error updating firmware description:", error);
      toast.error("An error occurred while updating the description");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Description
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Firmware Description</DialogTitle>
          <DialogDescription>
            Update the description for firmware version {firmware.version}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter firmware description"
                rows={5}
                className="resize-none"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}