"use server"

import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler"
import { Separator } from "@/components/ui/separator";
import ViewForm from "@/components/views/ViewForm"


export default async function NewViewForm() {
    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }, { href: '/dashboard/views', name: 'Views' }]}
                page="New"
            />
            <div className="container space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Create view</h1>
                <Separator />
                <ViewForm create redirect />
            </div>
        </>

    );
}