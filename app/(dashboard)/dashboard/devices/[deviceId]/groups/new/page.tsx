import { redirect } from "next/navigation";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { GroupForm } from "@/components/devices/groups/GroupForm";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import { Separator } from "@/components/ui/separator";
import DeviceMenu from "@/components/devices/DeviceMenu";

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
        <div className="space-y-6">
            <DeviceMenu deviceId={deviceId} activeTab="groups" variant="responsive" />

            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="New Group"
            />

            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create Group</h1>
                <p className="text-muted-foreground">
                    Create a new group for organizing sensors in {device.name}
                </p>
            </div>

            <Separator />

            <div className="max-w-2xl">
                <GroupForm deviceId={deviceId} />
            </div>
        </div>
    );
}