
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CreateCategoryFormData, ServerActionResponse } from "@/types/types";
import { SensorCategory } from "@prisma/client";
import CategoryForm from "./CategoryForm";
import { Button } from "../ui/button";

type CategoryDialogProps =
    | {
        categoryAction: (formData: CreateCategoryFormData) => Promise<ServerActionResponse>,
        create: true,
        addCategory?: (category: SensorCategory) => void
    }
    |
    {
        categoryAction: (formData: CreateCategoryFormData) => Promise<ServerActionResponse>,
        create: false; categoryId: string,
        addCategory?: (category: SensorCategory) => void
    };

export default function CategoryDialog(props: CategoryDialogProps) {
    const { create } = props;
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {create ? "Create" : "Edit"} category
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new category</DialogTitle>
                    <DialogDescription>
                        {create ? "Create a new category for your sensors" : "Edit an existing category"}
                    </DialogDescription>
                </DialogHeader>
                <CategoryForm {...props} />
            </DialogContent>
        </Dialog>

    )
}