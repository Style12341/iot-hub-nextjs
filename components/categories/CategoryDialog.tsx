"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { SensorCategory } from "@prisma/client";
import CategoryForm from "./CategoryForm";
import { Button } from "../ui/button";
import { ReactNode, useState } from "react";
import { Plus } from "lucide-react";

type CategoryDialogProps = {
    create: true,
    redirect?: boolean,
    initialData?: null,
    categoryId?: null,
    onSubmit?: (category: SensorCategory) => void,
    children?: ReactNode
} | {
    create: false,
    redirect?: boolean,
    initialData?: SensorCategory,
    categoryId: string,
    onSubmit?: (category: SensorCategory) => void,
    children?: ReactNode
}

export default function CategoryDialog({
    create,
    initialData = null,
    redirect = false,
    onSubmit,
    children
}: CategoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (category: SensorCategory) => {
        if (onSubmit) {
            onSubmit(category);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {create ? "Create category" : "Edit category"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {create ? "Create a new category" : "Edit category"}
                    </DialogTitle>
                    <DialogDescription>
                        {create
                            ? "Create a new category for your sensors"
                            : "Edit category details"
                        }
                    </DialogDescription>
                </DialogHeader>
                <CategoryForm
                    onSubmit={handleSubmit}
                    initialData={initialData}
                    redirect={redirect}
                />
            </DialogContent>
        </Dialog>
    );
}