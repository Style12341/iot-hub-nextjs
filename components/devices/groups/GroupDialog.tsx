"use client";

import { useState, ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Group } from "@prisma/client";
import { GroupForm } from "./GroupForm";

interface GroupDialogProps {
    deviceId: string;
    group?: Group;
    children: ReactNode;
    onSuccess?: (group: Group) => void;
    title?: string;
    description?: string;
}

export function GroupDialog({
    deviceId,
    group,
    children,
    onSuccess,
    title = "Edit Group",
    description = "Update the group's information",
}: GroupDialogProps) {
    const [open, setOpen] = useState(false);

    const handleSuccess = (updatedGroup: Group) => {
        if (onSuccess) {
            onSuccess(updatedGroup);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <GroupForm
                    deviceId={deviceId}
                    group={group}
                    onSuccess={handleSuccess}
                    isDialog={true}
                />
            </DialogContent>
        </Dialog>
    );
}