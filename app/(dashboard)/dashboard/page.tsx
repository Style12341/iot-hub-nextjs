"use server"
import { getDevicesQtyAction } from "@/app/actions/deviceActions";
import { getSensorsQtyAction } from "@/app/actions/sensorActions";
import { getSensorValuesMetricBetween } from "@/app/actions/userActions";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import Metric from "@/components/dashboard/Metric";
import { redirect } from "next/navigation";
import { LayoutGrid, Cpu, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function Dashboard() {
    const [devicesQtyRes, sensorsQtyRes, sensorValueMetricsRes] = await Promise.all([
        getDevicesQtyAction(),
        getSensorsQtyAction(),
        //Get metric from now minus 5 minutes to now
        getSensorValuesMetricBetween(new Date(Date.now() - 5 * 60000), new Date())
    ]);
    if (!devicesQtyRes.success || !sensorsQtyRes.success || !sensorValueMetricsRes.success) {
        return redirect("/login");
    }
    const devicesQtyAgg = devicesQtyRes.data;
    const sensorsQty = sensorsQtyRes.data;
    const sensorValueMetrics = sensorValueMetricsRes.data;
    let waitingDevicesQty = 0;
    let offlineDevicesQty = 0;
    let onlineDevicesQty = 0;
    devicesQtyAgg.forEach((agg) => {
        switch (agg.status) {
            case "WAITING":
                waitingDevicesQty = agg._count.id;
                break;
            case "OFFLINE":
                offlineDevicesQty = agg._count.id;
                break;
            case "ONLINE":
                onlineDevicesQty = agg._count.id;
                break;
        }
    })
    const devicesQty = waitingDevicesQty + offlineDevicesQty + onlineDevicesQty;

    // Sort metrics by timestamp
    sensorValueMetrics.sort((a, b) => a.timestamp.toISOString().localeCompare(b.timestamp.toISOString()));

    return (
        <>
            {/* Client component that handles breadcrumbs */}
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Overview"
            />
            <div className="container space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
                    <div className="flex flex-row md:flex-col gap-4">
                        <Metric
                            className="flex-1"
                            variant="number"
                            title="Total Devices"
                            value={devicesQty}
                            icon={<LayoutGrid className="h-4 w-4 text-muted-foreground" />}
                            suffix={
                                <div className="text-sm text-muted-foreground">
                                    <div>Online: {onlineDevicesQty}</div>
                                    <div>Offline: {offlineDevicesQty}</div>
                                    <div>Waiting: {waitingDevicesQty}</div>
                                </div>
                            }
                        />
                        <Metric
                            className="flex-1"
                            variant="number"
                            title="Total Sensors"
                            value={sensorsQty}
                            icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
                        />
                    </div>
                    <div className="">
                        <Metric

                            variant="graph"
                            title="Sensor Values"
                            description="Values uploaded in the last 5 minutes"
                            data={sensorValueMetrics}
                            timeRangeText="Last 5 minutes"
                            icon={<Database className="h-4 w-4 text-muted-foreground" />}
                            metricName="SENSOR_VALUES_PER_MINUTE"
                            fetchInterval={60000}
                        /></div>
                </div>
            </div>
        </>
    );
}