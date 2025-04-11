"use server"

import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler"
import ViewForm from "@/components/views/ViewForm"
import { getViewByIdAction } from "@/app/actions/viewActions"
import { redirect } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface EditViewPageProps {
    params: Promise<{
        viewId: string;
    }>;
}

export default async function EditViewPage({ params }: EditViewPageProps) {
    const { viewId } = await params;

    // Fetch the view data
    const response = await getViewByIdAction(viewId);

    if (!response.success || !response.data) {
        // Redirect to views list if the view doesn't exist or user doesn't have access
        redirect("/dashboard/views");
    }

    const view = response.data;

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[
                    { href: '/dashboard', name: 'Dashboard' },
                    { href: '/dashboard/views', name: 'Views' }
                ]}
                page={`Edit: ${view.name}`}
            />

            <div className="container mx-auto space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Edit view</h1>
                <Separator />
                <ViewForm
                    create={false}
                    initialData={view}
                    redirect={true}
                />
            </div>
        </>
    );
}