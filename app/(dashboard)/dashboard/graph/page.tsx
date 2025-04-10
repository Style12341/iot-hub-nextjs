import { getDevicesListWithDataAction } from "@/app/actions/deviceActions";
import { redirect } from "next/navigation";
import { SensorDataExplorer } from "@/components/devices/graph/SensorDataExplorer";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
export default async function GraphPage() {
    // Fetch all devices for the user (server-side)
    const deviceResponse = await getDevicesListWithDataAction();

    if (!deviceResponse.success) {
        redirect("/dashboard");
    }

    return (
        <>
            <BreadcrumbHandler
                breadcrumbs={[
                    { href: '/dashboard', name: 'Dashboard' }
                ]}
                page="Graph"
            />

            <div className="container py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Graphing</h1>
                    <p className="text-muted-foreground">
                        Select a device, group and sensors to visualize sensor data over time
                    </p>
                </div>

                <SensorDataExplorer initialDevices={deviceResponse.data.devices} />
            </div>
        </>
    );
}