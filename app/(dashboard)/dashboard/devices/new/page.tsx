import DeviceForm from "@/components/devices/DeviceForm";
import { createDeviceAction, getAllUserViewsAction } from "@/app/actions/deviceActions";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createCategoryAction } from "@/app/actions/categoryActions";
import { getUserCategories } from "@/lib/contexts/categoriesContext";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";

export default async function NewDevicePage() {
    const { userId } = await auth();
    if (!userId) {
        return redirect("/login");
    }
    // Get categories for the current user
    const categories = await getUserCategories(userId);
    const res = await getAllUserViewsAction();
    if (!res.success) {
        return redirect("/dashboard/devices/new");
    }
    const views = res.data;
    const breadcrumbs = [
        { href: '/dashboard', name: 'Dashboard' },
        { href: '/dashboard/devices', name: 'Devices' },
    ];
    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="New"></BreadcrumbHandler>
            <div className="container mx-auto py-8 px-8">
                <DeviceForm
                    views={views}
                    categories={categories}
                    deviceAction={createDeviceAction}
                    categoryAction={createCategoryAction}
                />
            </div>
        </>
    );
}