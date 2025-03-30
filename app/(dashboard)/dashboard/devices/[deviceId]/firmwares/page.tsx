import { getDeviceFirmwaresAction } from '@/app/actions/firmwareActions';
import { getDeviceWithActiveSensorsAction } from '@/app/actions/deviceActions';
import { FirmwareTable } from '@/components/firmware/FirmwareTable';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import BreadcrumbHandler from '@/components/dashboard/BreadcrumbHandler';

export default async function FirmwarePage({
    params
}: {
    params: Promise<{ deviceId: string }>
}) {
    const { deviceId } = await params;
    // Fetch firmwares and device info in parallel
    const [firmwaresResult] = await Promise.all([
        getDeviceFirmwaresAction(deviceId),
    ]);
    if (!firmwaresResult.success) {
        return redirect('/login');
    }
    const data = firmwaresResult.data;

    // Get assigned firmware ID if it exists
    const assignedFirmwareId = data.deviceData.AssignedFirmware?.id
    const activeFirmwareId = data.deviceData.ActiveFirmware?.id
    const breadcrumbs = [
        { href: '/dashboard', name: 'Dashboard' },
        { href: '/dashboard/devices', name: 'Devices' },
        { href: `/dashboard/devices/${data.deviceData.id}`, name: data.deviceData.name },
    ];
    return (
        <div className="space-y-6">
            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="Firmwares"
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Device Firmwares</h1>
                    <p className="text-muted-foreground">
                        Manage firmware for {data.deviceData.name}
                    </p>
                </div>
                <Link href={`/dashboard/devices/${deviceId}/firmwares/new`}>
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Upload Firmware
                    </Button>
                </Link>
            </div>

            {
                data.firmwares.length > 0 ? (
                    <FirmwareTable
                        firmwares={data.firmwares}
                        deviceId={deviceId}
                        activeFirmwareId={activeFirmwareId}
                        assignedFirmwareId={assignedFirmwareId}
                    />
                ) : (
                    <div className="rounded-md bg-muted p-8 text-center">
                        <h3 className="text-lg font-medium">No firmwares found</h3>
                        <p className="mt-2 text-muted-foreground">
                            Upload your first firmware to get started
                        </p>
                    </div>
                )
            }
        </div>
    );
}