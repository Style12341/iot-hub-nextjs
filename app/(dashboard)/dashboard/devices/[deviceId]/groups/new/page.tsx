import { redirect } from "next/navigation";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { GroupForm } from "@/components/devices/groups/GroupForm";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceMenu from "@/components/devices/DeviceMenu";
import { Suspense } from "react";

export default async function NewGroupPage({
    params,
}: {
    params: Promise<{ deviceId: string }>;
}) {
    const { deviceId } = await params;

    // Fetch the device to verify it exists and user has access
    const deviceResult = await getDeviceWithActiveSensorsAction(deviceId);

    if (!deviceResult.success) {
        return redirect('/login');
    }

    const device = deviceResult.data.device;
    const breadcrumbs = [
        { href: '/dashboard', name: 'Dashboard' },
        { href: '/dashboard/devices', name: 'Devices' },
        { href: `/dashboard/devices/${deviceId}`, name: device.name },
        { href: `/dashboard/devices/${deviceId}/groups`, name: 'Groups' },
    ];

    return (
        <div className="container mx-auto space-y-6">
            <DeviceMenu deviceId={deviceId} activeTab="groups" variant="responsive" />

            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="New"
            />

            <div>
                <h1 className="text-3xl font-bold mb-8">Create Group</h1>
                <p className="text-muted-foreground">
                    Create a new group for organizing sensors in {device.name}
                </p>
            </div>



            <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div>Loading form...</div>}>
                    <GroupForm deviceId={deviceId} />
                </Suspense>
            </div>
        </div>
    );
}