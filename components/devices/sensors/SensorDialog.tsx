"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { Sensor, SensorCategory } from "@prisma/client";
import { SensorForm } from "./SensorForm";
import { Plus } from "lucide-react";
import { SensorWithActiveGroupCount } from "@/lib/contexts/deviceContext";

interface SensorDialogProps {
  deviceId: string;
  categories: SensorCategory[];
  sensor?: SensorWithActiveGroupCount;
  children?: ReactNode;
  onSuccess?: (sensor: Sensor,activeGroups: number) => void;
}

export function SensorDialog({ deviceId, categories, sensor, children, onSuccess }: SensorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (sensor: Sensor, activeGroupCount: number) => {
    if (onSuccess) {
      onSuccess(sensor,activeGroupCount);
    }
    setIsOpen(false);
  };

  const isEditing = !!sensor;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {isEditing ? "Edit Sensor" : "Add Sensor"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Sensor" : "Add New Sensor"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this sensor"
              : "Add a new sensor to this device"}
          </DialogDescription>
        </DialogHeader>
        <SensorForm 
          deviceId={deviceId}
          sensor={sensor}
          categories={categories}
          onSuccess={handleSuccess}
          isDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
}