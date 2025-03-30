"use server"
import { getAllUserViewsAction } from "@/app/actions/deviceActions";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import ViewCollapsible from "@/components/views/ViewCollapsible";
import { redirect } from "next/navigation";

export default async function Views() {
    const response = await getAllUserViewsAction();
    if (!response.success) {
        redirect('/login');
    }
    const views = response.data;


    if (!views || views.length === 0) {
        return redirect('/dashboard/devices');
    }

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Views"
            />
            <div className="space-y-4">
                {views.map((view) => (
                    <ViewCollapsible
                        key={view.name}
                        viewName={view.name}
                        deviceCount={view.devicesCount}
                        defaultExpanded={view.name === "Default"} // Default view is expanded by default
                    />
                ))}
            </div>
        </>
    );
}