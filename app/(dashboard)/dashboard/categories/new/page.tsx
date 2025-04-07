"use server"

import { createCategoryAction } from "@/app/actions/categoryActions";
import CategoryForm from "@/components/categories/CategoryForm";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler"


export default async function NewCategoryForm() {
    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }, { href: '/dashboard/categories', name: 'Categories' }]}
                page="New"
            />
            <div className="container mx-auto py-8 px-8">
                <CategoryForm redirect />
            </div>
        </>

    );
}