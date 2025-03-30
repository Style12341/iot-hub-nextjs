import { Suspense } from "react";
import { getDeviceActiveViewWithActiveSensorsBetweenAction, getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { notFound } from "next/navigation";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceMenu from "@/components/devices/DeviceMenu";
import DeviceOverview from "@/components/devices/DeviceOverview";
import DeviceDetailGraphs from "@/components/devices/DeviceDetailGraphs";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceFirmwareState } from "@/lib/contexts/deviceContext";

export default async function DeviceDetailsPage({
    params
}: {
    params: Promise<{ deviceId: string }>
}) {
    const { deviceId } = await params;
    const deviceResult = await getDeviceActiveViewWithActiveSensorsBetweenAction(deviceId, new Date(Date.now() - 10 * 60 * 1000), new Date(Date.now()));
    const firmwareData = await getDeviceFirmwareState(deviceId);

    if (!deviceResult.success || !deviceResult.data || !firmwareData) {
        return notFound();
    }
    const device = deviceResult.data.device;
    console.log(device)

    return (
        <div className="space-y-6">
            <BreadcrumbHandler
                breadcrumbs={[
                    { href: '/dashboard', name: 'Dashboard' },
                    { href: '/dashboard/devices', name: 'Devices' }
                ]}
                page={device.name}
            />

            <DeviceMenu deviceId={device.id} activeTab="details" variant="responsive" />

            <div className="grid gap-6">
                <DeviceOverview device={device} firmware={firmwareData} />

                <Suspense fallback={<GraphsSkeleton />}>
                    <DeviceDetailGraphs
                        deviceId={device.id}
                        view={device.view}
                        initialData={device}
                    />
                </Suspense>
            </div>
        </div>
    );
}

function GraphsSkeleton() {
    return (
        <div>
            <Skeleton className="h-9 w-[180px] mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[250px] w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}