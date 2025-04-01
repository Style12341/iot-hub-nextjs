import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CreateViewFormData, ServerActionResponse } from "@/types/types";
import { View } from "@prisma/client";
import { Button } from "../ui/button";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import ViewForm from "./ViewForm";
import { DeviceWithViewPaginated } from "@/lib/contexts/deviceContext";

type ViewDialogProps = {
    onSubmit: (view: View) => void,
    buttonVariant?: "outline" | "ghost" | "link",
    buttonSize?: "default" | "sm" | "lg" | "icon",
};

export default function ViewDialog({
    onSubmit,
    buttonVariant = "outline",
    buttonSize = "icon"
}: ViewDialogProps) {
    const [open, setOpen] = useState(false);

    const handleAddView = (view: View) => {
        onSubmit(view);
        setOpen(false); // Close dialog after successful creation
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={buttonVariant} size={buttonSize} className="ml-2">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Create View</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create a new view</DialogTitle>
                    <DialogDescription>
                        Create a new view to organize your devices
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {/* Pass a custom viewAction that handles the dialog state */}
                    <ViewFormWrapper
                        create={true}
                        onSubmit={handleAddView}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Wrapper component to prevent form nesting issues
function ViewFormWrapper({ create, onSubmit }: {
    create: boolean;
    onSubmit: (view: View) => void;
}) {
    // Use state to control if the form is shown - prevents form nesting issues
    const [formKey] = useState(Math.random());

    return (
        <div key={formKey} className="view-form-wrapper">
            <ViewForm
                create={create}
                onSubmit={onSubmit}
                // Override the form onSubmit to prevent bubbling up
                formAttributes={{ onSubmit: e => e.stopPropagation() }}
            // Pass the viewAction
            />
        </div>
    );
}