import { Separator } from "@/components/ui/separator";
import { getCategoriesWithSensorCountAction } from "@/app/actions/categoryActions";
import { getDeviceAction, getDeviceSensorsAction } from "@/app/actions/deviceActions";
import { SensorTable } from "@/components/devices/sensors/SensorTable";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import { SensorDialog } from "@/components/devices/sensors/SensorDialog";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DeviceMenu from "@/components/devices/DeviceMenu";

interface SensorPageProps {
  params: Promise<{
    deviceId: string;
  }>;
}

export default async function SensorPage({ params }: SensorPageProps) {
  const { deviceId } = await params;

  // Fetch device info to get name
  const deviceResponse = await getDeviceAction(deviceId);

  if (!deviceResponse.success) {
    redirect("/dashboard/devices");
  }

  const device = deviceResponse.data;

  // Fetch sensors for this device
  const [sensorsResponse, categoriesResponse] = await Promise.all([getDeviceSensorsAction(deviceId), getCategoriesWithSensorCountAction()]);

  if (!sensorsResponse.success) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">{sensorsResponse.message || "Failed to load sensors"}</p>
        </div>
      </div>
    );
  }

  if (!categoriesResponse.success) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">{categoriesResponse.message || "Failed to load categories"}</p>
        </div>
      </div>
    );
  }

  const sensors = sensorsResponse.data;
  const categories = categoriesResponse.data;

  return (
    <>
      <BreadcrumbHandler
        breadcrumbs={[
          { href: '/dashboard', name: 'Dashboard' },
          { href: '/dashboard/devices', name: 'Devices' },
          { href: `/dashboard/devices/${deviceId}`, name: device.name }
        ]}
        page="Sensors"
      />
      <DeviceMenu deviceId={deviceId} activeTab="sensors" variant="responsive" />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sensors</h1>
            <p className="text-muted-foreground">
              Manage sensors for device: {device.name}
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/devices/${deviceId}/sensors/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sensor
            </Link>
          </Button>
        </div>

        <Separator />

        <SensorTable
          sensors={sensors}
          deviceId={deviceId}
          categories={categories}
        />
      </div>
    </>
  );
}