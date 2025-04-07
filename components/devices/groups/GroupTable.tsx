'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, EditIcon, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Group } from "@prisma/client";
import { setActiveGroupAction, deleteGroupAction } from "@/app/actions/groupActions";
import { GroupStatusIndicator } from './GroupStatusIndicator';
import { GroupDialog } from './GroupDialog';

interface GroupWithSensorCount extends Group {
    sensorCount: number;
    createdAt: Date;
}

interface GroupTableProps {
    groups: GroupWithSensorCount[];
    deviceId: string;
    activeGroupId?: string;
    onGroupDeleted?: () => void;
    onGroupEdited?: (group: Group) => void;
    onSetActive?: (groupId: string) => void;
}

export function GroupTable({
    groups: initialGroups,
    deviceId,
    activeGroupId,
    onGroupDeleted,
    onGroupEdited,
    onSetActive
}: GroupTableProps) {
    const [groups, setGroups] = useState<GroupWithSensorCount[]>(initialGroups);
    const [localActiveGroupId, setLocalActiveGroupId] = useState<string | undefined>(activeGroupId);

    // Update local state if props change
    useEffect(() => {
        setGroups(initialGroups);
    }, [initialGroups]);

    useEffect(() => {
        setLocalActiveGroupId(activeGroupId);
    }, [activeGroupId]);

    // Function to handle setting a group as active
    async function handleSetActive(groupId: string) {
        try {
            // Don't do anything if this group is already active
            if (groupId === localActiveGroupId) {
                return;
            }

            // Optimistically update UI
            setLocalActiveGroupId(groupId);

            // Call API to update active group
            const response = await setActiveGroupAction(deviceId, groupId);

            if (!response.success) {
                // Revert optimistic update if failed
                setLocalActiveGroupId(activeGroupId);
                throw new Error('Failed to update active group');
            }

            toast.success('Active group updated');

            if (onSetActive) {
                onSetActive(groupId);
            }
        } catch (error) {
            console.error('Error setting active group:', error);
            toast.error('Failed to update active group');
        }
    }

    // Function to handle group deletion
    async function handleDeleteGroup(groupId: string) {
        // Don't allow deleting active group
        if (groupId === localActiveGroupId) {
            toast.error("Cannot delete the active group");
            return;
        }

        try {
            const response = await deleteGroupAction(deviceId, groupId);

            if (!response.success) {
                throw new Error('Failed to delete group');
            }

            toast.success('Group deleted successfully');

            // Update local state
            setGroups((prev) => prev.filter((group) => group.id !== groupId));

            // Call callback if provided
            if (onGroupDeleted) {
                onGroupDeleted();
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Failed to delete group');
        }
    }

    // Function to handle edit request
    function handleEditGroup(group: Group, sensorCount: number) {
        if (onGroupEdited) {
            onGroupEdited(group);
        }
        setGroups((prev) =>
            prev.map((g) => (g.id === group.id ? { ...g, name: group.name, sensorCount: sensorCount } : g))
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Sensors</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[80px] text-center">Active</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map((group) => {
                        const isActive = group.id === localActiveGroupId;
                        const hasSensors = group.sensorCount > 0;

                        return (
                            <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell>{group.sensorCount}</TableCell>
                                <TableCell>{formatDate(group.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex justify-center">
                                        <GroupStatusIndicator
                                            isActive={isActive}
                                            onClick={() => handleSetActive(group.id)}
                                            tooltipText={
                                                isActive
                                                    ? 'This is the active group'
                                                    : 'Click to set as active group'
                                            }
                                            interactive={true}
                                        />
                                    </div>
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
                                                <GroupDialog
                                                    deviceId={deviceId}
                                                    group={group}
                                                    onSuccess={handleEditGroup}
                                                >
                                                    <Button variant="ghost" className="w-full justify-start" size="sm">
                                                        <EditIcon className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                </GroupDialog>
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild className="p-0">
                                                    <DropdownMenuItem
                                                        onSelect={(e) => e.preventDefault()}
                                                        disabled={isActive}
                                                        className={isActive ? "text-muted-foreground" : ""}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className={cn(
                                                                "w-full justify-start",
                                                                !isActive && "text-destructive"
                                                            )}
                                                            size="sm"
                                                            disabled={isActive}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete {group.name}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this group?
                                                            {hasSensors && (
                                                                <span className="block mt-2 font-medium text-destructive">
                                                                    This group has {group.sensorCount} {group.sensorCount === 1 ? 'sensor' : 'sensors'} assigned.
                                                                    {` `}Deleting it will remove all sensors assigned to it.
                                                                </span>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteGroup(group.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}