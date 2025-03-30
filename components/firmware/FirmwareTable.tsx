'use client';

import { Firmware } from '@prisma/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { InfoIcon, DownloadIcon, TrashIcon, MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FirmwareStatusIndicator } from './FirmwareStatusIndicator';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from '@/lib/utils';
import { assignFirmwareAction, deleteFirmwareAction } from '@/app/actions/firmwareActions';
import { FirmwareType } from '@/lib/contexts/firmwareContext';
import { DeviceSSEMessage } from '@/types/types';
import { subscribeToDeviceEvents } from '@/lib/sseUtils';

interface FirmwareTableProps {
    firmwares: FirmwareType[];
    deviceId: string;
    assignedFirmware?: FirmwareType
    activeFirmware?: FirmwareType
    onFirmwareDeleted?: () => void;
}

export function FirmwareTable({
    firmwares: passedFirmwares,
    deviceId,
    assignedFirmware,
    activeFirmware,
    onFirmwareDeleted
}: FirmwareTableProps) {
    const [localAssignedId, setLocalAssignedId] = useState<string | null>(assignedFirmware?.id || null);
    const [localActiveFirmware, setActiveFirmware] = useState(activeFirmware || null);
    const [firmwares, setFirmwares] = useState<FirmwareType[]>(passedFirmwares);
    // Add state to track which firmware is pending deletion
    const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Update local state if prop changes (e.g. from revalidation)
    useEffect(() => {
        setLocalAssignedId(assignedFirmware?.id || null);
    }, [assignedFirmware?.id]);
    useEffect(() => {
        const handleFirmwareUpdate = (data: DeviceSSEMessage) => {
            console.log("Received firmware update:", data);
            if (data.type === "connected") {
                return;
            }
            setActiveFirmware(prev => {
                if (data.activeFirmwareVersion && prev) {
                    return {
                        ...prev,
                        version: data.activeFirmwareVersion,
                    };
                }
                return prev;
            });
        };

        // Subscribe to events using the function
        const unsubscribe = subscribeToDeviceEvents([deviceId], handleFirmwareUpdate);

        // Clean up subscription on unmount
        return () => unsubscribe();
    }, [])

    // Function to handle assignment changes
    async function handleAssignmentToggle(firmwareId: string) {
        try {
            // If this firmware is already assigned, do nothing
            if (firmwareId === localAssignedId) {
                return;
            }

            // Optimistically update UI
            setLocalAssignedId(firmwareId);

            // Call API to update assignment
            const response = await assignFirmwareAction(deviceId, firmwareId);

            if (!response.success) {
                // Revert optimistic update if failed
                setLocalAssignedId(assignedFirmware?.id || null);
                throw new Error('Failed to update firmware assignment');
            }

            toast.success('Firmware assignment updated');
        } catch (error) {
            console.error('Error assigning firmware:', error);
            toast.error('Failed to update firmware assignment');
        }
    }

    // Function to mark firmware for deletion
    function markForDeletion(firmwareId: string) {
        setPendingDeletionId(firmwareId);
    }

    // Function to cancel deletion
    function cancelDeletion() {
        setPendingDeletionId(null);
    }

    // Function to delete firmware
    async function deleteFirmware(firmwareId: string) {
        try {
            // Don't allow deleting assigned or active firmware
            if (firmwareId === localAssignedId || firmwareId === localActiveFirmware?.id) {
                toast.error("Cannot delete a firmware that is assigned or active");
                return;
            }

            setIsDeleting(true);

            // Call API to delete firmware
            const response = await deleteFirmwareAction(deviceId, firmwareId);

            if (!response.success) {
                throw new Error('Failed to delete firmware');
            }

            toast.success('Firmware deleted successfully');
            setFirmwares((prev) => prev.filter((firmware) => firmware.id !== firmwareId));

            // Refresh the list if callback provided
            if (onFirmwareDeleted) {
                onFirmwareDeleted();
            }
        } catch (error) {
            console.error('Error deleting firmware:', error);
            toast.error('Failed to delete firmware');
        } finally {
            setIsDeleting(false);
            setPendingDeletionId(null);
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="w-[80px] text-center">Assigned</TableHead>
                        <TableHead className="w-[80px] text-center">Active</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {firmwares.map((firmware) => {
                        const isPendingDeletion = firmware.id === pendingDeletionId;
                        console.log(firmware)

                        return (
                            <TableRow
                                key={firmware.id}
                                className={cn(
                                    isPendingDeletion && "bg-destructive/10 transition-colors"
                                )}
                            >
                                <TableCell className="font-medium">
                                    {firmware.version}
                                    {isPendingDeletion && (
                                        <span className="ml-2 text-xs text-destructive">
                                            (pending deletion)
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="lg:max-w-[300px] max-w-[100px] truncate">
                                                    {firmware.description}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs break-words whitespace-normal">
                                                <p className="text-sm">{firmware.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                    {formatDate(firmware.createdAt)}
                                </TableCell>
                                {/* Assigned Firmware Column - Interactive */}
                                <TableCell >
                                    <div className={"flex justify-center"}>
                                        <FirmwareStatusIndicator
                                            isActive={firmware.id === localAssignedId}
                                            isEmbedded={firmware.embedded}
                                            onClick={() => handleAssignmentToggle(firmware.id)}
                                            tooltipText={firmware.id === localAssignedId
                                                ? 'Assigned to device'
                                                : isPendingDeletion ? 'Cannot assign while pending deletion' : firmware.embedded ? 'Cannot assign embedded firmware' : 'Click to assign firmware'}
                                            interactive={!isPendingDeletion}
                                        />
                                    </div>
                                </TableCell>
                                {/* Active Firmware Column - Display Only */}
                                <TableCell className="flex justify-center">
                                    <FirmwareStatusIndicator
                                        isActive={firmware.version === localActiveFirmware?.version}
                                        tooltipText={firmware.version === localActiveFirmware?.version
                                            ? 'Currently running on device'
                                            : 'Not currently active'}
                                        interactive={false}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    {isPendingDeletion ? (
                                        <div className="flex justify-end space-x-2">
                                            <span className="text-sm text-muted-foreground mr-2 pt-1">Confirm deletion?</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={cancelDeletion}
                                                disabled={isDeleting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteFirmware(firmware.id)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreHorizontalIcon className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                {/* Details Option */}
                                                <Link href={`/dashboard/devices/${deviceId}/firmwares/${firmware.id}`} passHref>
                                                    <DropdownMenuItem>
                                                        <InfoIcon className="mr-2 h-4 w-4" />
                                                        <span>View details</span>
                                                    </DropdownMenuItem>
                                                </Link>

                                                {firmware.embedded ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                                                                    <DownloadIcon className="mr-2 h-4 w-4" />
                                                                    <span>Download binary</span>
                                                                </DropdownMenuItem>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left">
                                                                <p className="text-sm">Cannot download local embedded firmwares</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={`/api/v1/devices/${deviceId}/firmwares/${firmware.id}`}
                                                            download={`${firmware.version}-firmware.bin`}
                                                        >
                                                            <DownloadIcon className="mr-2 h-4 w-4" />
                                                            <span>Download binary</span>
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />

                                                {/* Delete Option - now just marks for deletion */}
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    disabled={firmware.id === localAssignedId || firmware.version === localActiveFirmware?.version}
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        markForDeletion(firmware.id);
                                                    }}
                                                >
                                                    <TrashIcon className="mr-2 h-4 w-4" />
                                                    <span>Delete firmware</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}