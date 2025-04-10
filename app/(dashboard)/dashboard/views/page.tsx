"use server";

import { getAllUserViewsAction } from "@/app/actions/deviceActions";
import { getUserDefaultViewId } from "@/lib/contexts/viewContext";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import ViewCollapsible from "@/components/views/ViewCollapsible";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
            <div className="container space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Views</h1>
                    <Button asChild>
                        <Link href="/dashboard/views/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add View
                        </Link>
                    </Button>
                </div>
                <Separator />
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
            </div>
        </>
    );
}