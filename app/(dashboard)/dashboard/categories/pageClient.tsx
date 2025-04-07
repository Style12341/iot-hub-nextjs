// Create a separate client component for the interactive parts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SensorCategoryWithCount } from "@/lib/contexts/categoriesContext";
import { DataTable } from "@/components/data-table";
import { SensorCategory } from "@prisma/client";
import { columns } from "./categoryColumns";

export function CategoriesClient({
    initialCategories
}: {
    initialCategories: Array<SensorCategoryWithCount>;
}) {
    const [categories, setCategories] = useState(initialCategories);

    const handleCategoryUpdate = (updatedCategory: SensorCategory) => {
        setCategories(prevCategories =>
            prevCategories.map(cat =>
                cat.id === updatedCategory.id
                    ? { ...cat, ...updatedCategory }
                    : cat
            )
        );
    };
    const handleCategoryDelete = (categoryId: string) => {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
    const handleCategoryCreate = (newCategory: SensorCategory) => {
        setCategories((prev) => [...prev, { ...newCategory, sensorCount: 0 }]);
    };
    useEffect(() => {
        const listener = (event: Event) => {
            const customEvent = event as CustomEvent;
            handleCategoryCreate(customEvent.detail);
        };

        document.addEventListener("categoryCreated", listener);

        return () => {
            document.removeEventListener("categoryCreated", listener);
        };
    }, []);

    return (
        <DataTable
            columns={columns(handleCategoryUpdate, handleCategoryDelete)}
            data={categories}
            searchKey="name"
            searchPlaceholder="Search categories..."
        />
    );
}