"use server"

import { createCategoryAction } from "@/app/actions/categoryActions";
import CategoryForm from "@/components/categories/CategoryForm";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler"
import { Separator } from "@/components/ui/separator";


export default async function NewCategoryForm() {
    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }, { href: '/dashboard/categories', name: 'Categories' }]}
                page="New"
            />
            <div className="container space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Create category</h1>
                <Separator />
                <div className="container mx-auto">
                    <CategoryForm redirect />
                </div>
            </div>
        </>

    );
}