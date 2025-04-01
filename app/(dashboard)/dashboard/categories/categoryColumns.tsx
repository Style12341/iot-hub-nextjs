"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SensorCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CategoryDialog from "@/components/categories/CategoryDialog";
import { deleteCategoryAction, editCategoryAction } from "@/app/actions/categoryActions";
import { SensorCategoryWithCount } from "@/lib/contexts/categoriesContext";
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
import { toast } from "sonner";
import { useState } from "react";

// Define the data type for our rows
type CategoryRow = SensorCategoryWithCount;

// Column definitions function that accepts the update handler
export const columns = (onCategoryUpdated: (category: SensorCategory) => void, onCategoryDeleted: (categoryId: string) => void): ColumnDef<CategoryRow>[] => [
    {
        accessorKey: "name",
        header: "Name",
        sortingFn: "text",
        enableSorting: true,
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("name")}</div>
        ),
    },
    {
        accessorKey: "color",
        enableSorting: false,
        header: "Color",
        cell: ({ row }) => {
            const color = row.getValue("color") as string;
            return (
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-sm">{color}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "sensorCount",
        header: "Sensors",
        sortingFn: (a, b) => {
            const aCount = a.getValue("sensorCount") as number;
            const bCount = b.getValue("sensorCount") as number;
            return aCount - bCount;
        },
        sortDescFirst: true,
        cell: ({ row }) => {
            const count = row.getValue("sensorCount") as number;
            return (
                <Badge variant="secondary" className="font-mono">
                    {count} {count === 1 ? "sensor" : "sensors"}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const category = row.original;
            const [isDeleting, setIsDeleting] = useState(false);

            // Handle category deletion
            const handleDelete = async () => {
                try {
                    setIsDeleting(true);
                    const result = await deleteCategoryAction(category.id);
                    if (result.success) {
                        toast.success("Category deleted successfully");
                        onCategoryDeleted(category.id);
                    } else {
                        toast.error("Failed to delete category", {
                            description: result.message
                        });
                    }
                } catch (error) {
                    toast.error("An error occurred", {
                        description: "Could not delete the category"
                    });
                } finally {
                    setIsDeleting(false);
                }
            };

            const hasSensors = category.sensorCount > 0;

            return (
                <div className="text-right">
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
                                <CategoryDialog
                                    categoryId={category.id}
                                    create={false}
                                    initialData={category}
                                    onSubmit={onCategoryUpdated}
                                >
                                    <Button variant="ghost" className="w-full justify-start" size="sm">
                                        <EditIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </CategoryDialog>
                            </DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild className="p-0">
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Button variant="ghost" className="w-full justify-start text-destructive" size="sm">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {category.name}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this category?
                                            {hasSensors && (
                                                <span className="block mt-2 font-medium text-destructive">
                                                    This category has {category.sensorCount} {category.sensorCount === 1 ? 'sensor' : 'sensors'} attached to it.
                                                    {` `}Deleting it will remove the category from these sensors.
                                                </span>
                                            )}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
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
                </div>
            );
        },
    },
];