import { Separator } from "@/components/ui/separator";
import { SensorForm } from "@/components/devices/sensors/SensorForm";
import { getCategoriesWithSensorCountAction } from "@/app/actions/categoryActions";
import { getDeviceAction } from "@/app/actions/deviceActions";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import { redirect } from "next/navigation";

interface NewSensorPageProps {
  params: Promise<{
    deviceId: string;
  }>;
}

export default async function NewSensorPage({ params }: NewSensorPageProps) {
  const { deviceId } = await params;

  // Fetch device info to get name
  const deviceResponse = await getDeviceAction(deviceId);

  if (!deviceResponse.success) {
    redirect("/dashboard/devices");
  }

  const device = deviceResponse.data;

  // Fetch all categories for the dropdown
  const categoriesResponse = await getCategoriesWithSensorCountAction();

  if (!categoriesResponse.success) {
    redirect(`/dashboard/devices/${deviceId}/sensors`);
  }

  const categories = categoriesResponse.data;

  return (
    <>
      <BreadcrumbHandler
        breadcrumbs={[
          { href: '/dashboard', name: 'Dashboard' },
          { href: '/dashboard/devices', name: 'Devices' },
          { href: `/dashboard/devices/${deviceId}`, name: device.name },
          { href: `/dashboard/devices/${deviceId}/sensors`, name: 'Sensors' }
        ]}
        page="New"
      />
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Sensor</h1>
          <p className="text-muted-foreground">
            Add a new sensor to device: {device.name}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SensorForm
            deviceId={deviceId}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
}