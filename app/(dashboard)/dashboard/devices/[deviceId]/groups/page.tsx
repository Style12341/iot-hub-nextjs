import { getDeviceGroupsAction } from "@/app/actions/groupActions";
import { GroupTable } from "@/components/devices/groups/GroupTable";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceMenu from "@/components/devices/DeviceMenu";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { Separator } from "@/components/ui/separator";

export default async function GroupsPage({
    params
}: {
    params: Promise<{ deviceId: string }>
}) {
    const { deviceId } = await params;

    // Fetch device info and groups in parallel
    const [deviceResult, groupsResult] = await Promise.all([
        getDeviceWithActiveSensorsAction(deviceId),
        getDeviceGroupsAction(deviceId),
    ]);

    if (!deviceResult.success || !groupsResult.success) {
        if (deviceResult.statusCode === 404 || groupsResult.statusCode === 404) {
            notFound();
        }
        return redirect('/login');
    }

    const device = deviceResult.data.device;
    const { groups, activeGroupId } = groupsResult.data;

    const breadcrumbs = [
        { href: '/dashboard', name: 'Dashboard' },
        { href: '/dashboard/devices', name: 'Devices' },
        { href: `/dashboard/devices/${deviceId}`, name: device.name },
    ];

    return (
        <div className="container mx-auto space-y-6">
            <DeviceMenu deviceId={deviceId} activeTab="groups" variant="responsive" />

            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="Groups"
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
                    <p className="text-muted-foreground">
                        Manage groups for {device.name}
                    </p>
                </div>
                <Link href={`/dashboard/devices/${deviceId}/groups/new`}>
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Group
                    </Button>
                </Link>
            </div>
            <Separator />
            {groups.length > 0 ? (
                <GroupTable
                    groups={groups}
                    deviceId={deviceId}
                    activeGroupId={activeGroupId ?? ""}
                />
            ) : (
                <div className="rounded-md bg-muted p-8 text-center">
                    <h3 className="text-lg font-medium">No groups found</h3>
                    <p className="mt-2 text-muted-foreground">
                        Create your first group to start organizing sensors
                    </p>
                </div>
            )}
        </div>
    );
}