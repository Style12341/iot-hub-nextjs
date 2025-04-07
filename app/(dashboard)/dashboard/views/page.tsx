"use server";

import { getAllUserViewsAction } from "@/app/actions/deviceActions";
import { getUserDefaultViewId } from "@/lib/contexts/viewContext";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import ViewCollapsible from "@/components/views/ViewCollapsible";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function Views() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/login');
    }

    const response = await getAllUserViewsAction();
    if (!response.success) {
        redirect('/login');
    }

    const views = response.data;
    if (!views || views.length === 0) {
        return redirect('/dashboard/devices');
    }

    // Get the default view
    const defaultViewId = await getUserDefaultViewId(userId);

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Views"
            />
            <div className="space-y-4">
                {views.map((view) => (
                    <ViewCollapsible
                        key={view.id}
                        viewId={view.id}
                        viewName={view.name}
                        deviceCount={view.devicesCount}
                        defaultExpanded={view.name === "Default"}
                        isDefaultView={view.id === defaultViewId}
                    />
                ))}
            </div>
        </>
    );
}