"use server"
import { getCategoriesWithSensorCountAction } from "@/app/actions/categoryActions";
import { Separator } from "@/components/ui/separator";
import CategoryDialog from "@/components/categories/CategoryDialog";
import { CategoriesClient } from "./pageClient";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";

export default async function CategoriesPage() {
    const response = await getCategoriesWithSensorCountAction();

    if (!response.success) {
        return (
            <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
                    <p className="text-muted-foreground">{response.message || "Failed to load categories"}</p>
                </div>
            </div>
        );
    }

    const categories = response.data;

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Categories"
            />
            <div className="space-y-6 container mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                        <p className="text-muted-foreground">
                            Manage your sensor categories to organize your data.
                        </p>
                    </div>
                    <CategoryDialog
                        create={true}
                        redirect={true}
                    />
                </div>

                <Separator />

                <CategoriesClient initialCategories={categories} />
            </div>
        </>
    );
}

