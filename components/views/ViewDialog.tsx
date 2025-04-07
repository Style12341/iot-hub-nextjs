"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { View } from "@prisma/client";
import { Button } from "../ui/button";
import { ReactNode, useState } from "react";
import { Plus, Edit } from "lucide-react";
import ViewForm from "./ViewForm";

type ViewDialogProps = {
    create: boolean;
    initialData?: View | null;
    onSubmit?: (view: View) => void;
    children?: ReactNode;
    buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export default function ViewDialog({
    create,
    initialData = null,
    onSubmit,
    children,
    buttonVariant = "default"
}: ViewDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (view: View) => {
        if (onSubmit) {
            onSubmit(view);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant={buttonVariant}>
                        {create ? (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create View
                            </>
                        ) : (
                            <>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit View
                            </>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {create ? "Create a new view" : "Edit view"}
                    </DialogTitle>
                    <DialogDescription>
                        {create
                            ? "Create a new view to organize your devices"
                            : "Modify this view's settings and add devices to it"
                        }
                    </DialogDescription>
                </DialogHeader>
                <ViewFormWrapper
                    create={create}
                    initialData={initialData}
                    onSubmit={handleSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}

// Wrapper component to prevent form nesting issues
function ViewFormWrapper({
    create,
    initialData,
    onSubmit
}: {
    create: boolean;
    initialData?: View | null;
    onSubmit: (view: View) => void;
}) {
    // Use state to control if the form is shown - prevents form nesting issues
    const [formKey] = useState(Math.random());

    return (
        <div key={formKey} className="view-form-wrapper">
            <ViewForm
                create={create}
                initialData={initialData}
                onSubmit={onSubmit}
                // Override the form onSubmit to prevent bubbling up
                formAttributes={{ onSubmit: e => e.stopPropagation() }}
            />
        </div>
    );
}