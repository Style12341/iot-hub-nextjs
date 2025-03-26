"use server"
import { getDevicesViewWithActiveSensorsBetweenAction, getDevicesWithActiveSensorsAction } from "@/app/actions/deviceActions";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceViewWrapper from "@/components/devices/DeviceViewWrapper";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Views() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/login');
    }
    const endDate = new Date();
    // start date 24 hours ago
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    const result = await getDevicesViewWithActiveSensorsBetweenAction(userId, "Default", startDate, endDate);
    if (!result) {
        return redirect('/dashboard/devices');
    }
    const devices = result.map((device) => {
        return device.device;
    }
    );

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Views"
            />
            <DeviceViewWrapper initialDevices={devices} />
        </>
    )
}