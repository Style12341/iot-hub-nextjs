import { getDevicesWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import DeviceCard from "@/components/devices/DeviceCard";
import EmptyDevices from "@/components/devices/EmptyDevices";

export default async function DevicesIndex() {
    const { userId } = await auth();
    if (!userId) {
        return redirect("/login");
    }
    const results = await getDevicesWithActiveSensorsAction(userId);

    return (
        <div className="space-y-6">
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard/devices', name: 'Devices' }]}
                page="All"
            />

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
                <Button asChild>
                    <Link href="/dashboard/devices/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Device
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((device) => (
                    <DeviceCard key={device.device.id} device={device.device} />
                ))}
            </div>

            {results.length === 0 && <EmptyDevices />}
        </div>
    );
}