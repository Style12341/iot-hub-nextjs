import { getDeviceAction, getDeviceGroupsWithSensorsAction } from "@/app/actions/deviceActions";
import { getAllUserViewsAction } from "@/app/actions/deviceActions";
import { CodeBlock } from "@/components/CodeBlock";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceApiCode from "@/components/devices/DeviceApiCode";
import DeviceMenu from "@/components/devices/DeviceMenu";
import { DeviceSettingsForm } from "@/components/devices/DeviceSettingsForm";
import { Separator } from "@/components/ui/separator";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface DeviceSettingsPageProps {
    params: Promise<{
        deviceId: string;
    }>;
}

export default async function DeviceSettingsPage({ params }: DeviceSettingsPageProps) {
    const { deviceId } = await params;

    // Fetch device details
    const [deviceResponse, deviceGroupsResponse, viewsResponse] = await Promise.all([
        getDeviceAction(deviceId),
        getDeviceGroupsWithSensorsAction(deviceId),
        getAllUserViewsAction()
    ])

    if (!deviceResponse.success) {
        redirect("/dashboard/devices");
    }
    if (!deviceGroupsResponse.success) {
        redirect("/dashboard/devices");
    }
    if (!viewsResponse.success) {
        redirect("/dashboard/devices");
    }
    const device = deviceResponse.data;
    const deviceGroupsWSensors = deviceGroupsResponse.data;
    const views = viewsResponse.data;

    return (
        <>
            <DeviceMenu deviceId={deviceId} activeTab="api" variant="responsive" />
            <BreadcrumbHandler
                breadcrumbs={[
                    { href: '/dashboard', name: 'Dashboard' },
                    { href: '/dashboard/devices', name: 'Devices' },
                    { href: `/dashboard/devices/${deviceId}`, name: device.name }
                ]}
                page="Api Code"
            />

            <div className="container mx-auto py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Code</h1>
                    <p className="text-muted-foreground">
                        This is the code you need to send to the device to update its state.
                        <br /> Select the appropriate format for your implementation.
                    </p>
                </div>
                
                <Separator />
                <DeviceApiCode device={deviceGroupsWSensors} />
            </div>
        </>
    );
}