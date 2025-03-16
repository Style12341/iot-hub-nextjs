import DeviceForm from "@/components/devices/DeviceForm";
import { createDeviceAction } from "@/app/actions/deviceActions";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export default async function NewDevicePage() {
    const { userId } = await auth();
    if (!userId) {
        return redirect("/login");
    }
    // Get categories for the current user
    const categories = await prisma.sensorCategory.findMany({
        where: {
            userId
        },
        select: { id: true, name: true }
    });

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Create New Device</h1>
            <DeviceForm
                categories={categories}
                createDeviceAction={createDeviceAction}
            />
        </div>
    );
}