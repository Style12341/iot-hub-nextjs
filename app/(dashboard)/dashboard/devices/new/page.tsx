import DeviceForm from "@/components/devices/DeviceForm";
import { createDeviceAction } from "@/app/actions/deviceActions";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createCategoryAction } from "@/app/actions/categoryActions";
import CategoryDialog from "@/components/categories/CategoryDialog";
import { getUserCategories } from "@/lib/contexts/categoriesContext";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";

const prisma = new PrismaClient();

export default async function NewDevicePage() {
    const { userId } = await auth();
    if (!userId) {
        return redirect("/login");
    }
    // Get categories for the current user
    const categories = await getUserCategories(userId);

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard/devices', name: 'Devices' }]}
                page="New"></BreadcrumbHandler>
            <div className="container mx-auto py-8 px-8">
                <DeviceForm
                    categories={categories}
                    deviceAction={createDeviceAction}
                    categoryAction={createCategoryAction}
                />
            </div>
        </>
    );
}