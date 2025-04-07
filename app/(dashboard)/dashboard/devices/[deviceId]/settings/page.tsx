import { getDeviceAction } from "@/app/actions/deviceActions";
import { getAllUserViewsAction } from "@/app/actions/deviceActions";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import { DeviceSettingsForm } from "@/components/devices/DeviceSettingsForm";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";

interface DeviceSettingsPageProps {
  params: Promise<{
    deviceId: string;
  }>;
}

export default async function DeviceSettingsPage({ params }: DeviceSettingsPageProps) {
  const { deviceId } = await params;

  // Fetch device details
  const deviceResponse = await getDeviceAction(deviceId);

  if (!deviceResponse.success) {
    redirect("/dashboard/devices");
  }

  const device = deviceResponse.data;

  // Fetch available views
  const viewsResponse = await getAllUserViewsAction();

  if (!viewsResponse.success) {
    redirect("/dashboard/devices");
  }

  const views = viewsResponse.data;

  return (
    <>
      <BreadcrumbHandler
        breadcrumbs={[
          { href: '/dashboard', name: 'Dashboard' },
          { href: '/dashboard/devices', name: 'Devices' },
          { href: `/dashboard/devices/${deviceId}`, name: device.name }
        ]}
        page="Settings"
      />

      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Settings</h1>
          <p className="text-muted-foreground">
            Manage settings for device: {device.name}
          </p>
        </div>

        <Separator />

        <DeviceSettingsForm device={device} views={views} />
      </div>
    </>
  );
}