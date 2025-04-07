"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SensorDialog } from './SensorDialog';
import { deleteSensorAction } from '@/app/actions/sensorActions';
import { Sensor, SensorCategory } from '@prisma/client';
import { SensorWithActiveGroupCount } from '@/lib/contexts/deviceContext';
import { Badge } from '@/components/ui/badge';

interface SensorTableProps {
  sensors: SensorWithActiveGroupCount[];
  deviceId: string;
  categories: SensorCategory[];
  onSensorDeleted?: () => void;
  onSensorEdited?: (sensor: Sensor) => void;
}

export function SensorTable({
  sensors: initialSensors,
  deviceId,
  categories,
  onSensorDeleted,
  onSensorEdited
}: SensorTableProps) {
  const [sensors, setSensors] = useState<SensorWithActiveGroupCount[]>(initialSensors);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state if props change
  useEffect(() => {
    setSensors(initialSensors);
  }, [initialSensors]);

  // Function to handle sensor deletion
  async function handleDeleteSensor(sensorId: string) {
    try {
      setIsDeleting(true);
      const response = await deleteSensorAction(deviceId, sensorId);

      if (!response.success) {
        throw new Error('Failed to delete sensor');
      }

      toast.success('Sensor deleted successfully');

      // Update local state
      setSensors((prev) => prev.filter((sensor) => sensor.id !== sensorId));

      // Call callback if provided
      if (onSensorDeleted) {
        onSensorDeleted();
      }
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast.error('Failed to delete sensor');
    } finally {
      setIsDeleting(false);
    }
  }

  // Function to handle edit request
  function handleEditSensor(sensor: Sensor, activeGroupCount: number) {
    if (onSensorEdited) {
      onSensorEdited(sensor);
    }
    setSensors((prev) =>
      prev.map((s) => (s.id === sensor.id ? { ...s, ...sensor, activeGroupCount: activeGroupCount } : s))
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Active Groups</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensors.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell className="font-medium">{sensor.name}</TableCell>
              <TableCell>{sensor.unit}</TableCell>
              <TableCell>
                {sensor.Category ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: sensor.Category.color }}
                    />
                    <span>{sensor.Category.name}</span>
                  </div>
                ) : (
                  "No category"
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono">
                  {sensor.activeGroupCount}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <SensorDialog
                        deviceId={deviceId}
                        sensor={sensor}
                        categories={categories}
                        onSuccess={handleEditSensor}
                      >
                        <Button variant="ghost" className="w-full justify-start" size="sm">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </SensorDialog>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild className="p-0">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive"
                            size="sm"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {sensor.name}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this sensor?
                            <span className="block mt-2 font-medium text-destructive">
                              This will permanently delete the sensor and all its historical data.
                              This action cannot be undone.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSensor(sensor.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}