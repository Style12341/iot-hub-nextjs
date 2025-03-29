import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import BreadcrumbHandler from '@/components/dashboard/BreadcrumbHandler';
import { FirmwareUploadForm } from '@/components/firmware/FirmwareUploadForm';
import { getDevice } from '@/lib/contexts/deviceContext';


// This is a server component
export default async function NewFirmwarePage({ params }: { params: Promise<{ deviceId: string }> }) {
    const { deviceId } = await params;

    // Fetch device details from database for breadcrumb
    const device = await getDevice(deviceId);

    // If device not found, return 404
    if (!device) {
        notFound();
    }

    // Set up breadcrumbs
    const breadcrumbs = [
        { href: '/dashboard', name: 'Dashboard' },
        { href: '/dashboard/devices', name: 'Devices' },
        { href: `/dashboard/devices/${deviceId}`, name: device.name },
        { href: `/dashboard/devices/${deviceId}/firmwares`, name: 'Firmwares' },
    ];

    return (
        <div className="container mx-auto py-8">
            <BreadcrumbHandler
                breadcrumbs={breadcrumbs}
                page="Upload Firmware"
            />
            <h1 className="text-3xl font-bold mb-8">Upload New Firmware</h1>
            <div className="max-w-2xl">
                <Suspense fallback={<div>Loading form...</div>}>
                    <FirmwareUploadForm
                        deviceId={deviceId}
                    />
                </Suspense>
            </div>
        </div>
    );
}