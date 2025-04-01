"use server"

import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler"
import ViewForm from "@/components/views/ViewForm"


export default async function NewViewForm() {
    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }, { href: '/dashboard/views', name: 'Views' }]}
                page="New"
            />
            <ViewForm create />
        </>

    );
}