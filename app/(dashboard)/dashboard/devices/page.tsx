import { getDevicesWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import EmptyDevices from "@/components/devices/EmptyDevices";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import DeviceIndexWrapper from "@/components/devices/DeviceIndexWrapper";


export default async function DevicesIndex({
    searchParams,
}: {
    searchParams: Promise<{ page: number }>;
}) {
    const page = (await searchParams).page || 1;
    const response = await getDevicesWithActiveSensorsAction(page);
    if (!response.success) {
        return redirect("/login");
    }
    const results = response.data;
    const devices = results.devices.map((device) => {
        return device.device;
    }
    );
    const { maxPage, count, page: currPage } = results;

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

            <DeviceIndexWrapper initialDevices={devices} key={`devices-page${currPage}`} />
            {devices.length > 0 && <>
                <div className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Showing {devices.length} of {count} devices
                    </p>
                </div>
                <Pagination>
                    <PaginationContent>
                        {currPage > 1 &&
                            <PaginationItem>
                                <PaginationPrevious href={`/dashboard/devices?page=${page - 1}`} />
                            </PaginationItem>
                        }
                        {maxPage > 1 && [...Array(maxPage).keys()].map((i) => {
                            const pageNumber = i + 1;
                            const active = pageNumber === currPage;
                            if (pageNumber === currPage || pageNumber === 1 || pageNumber === maxPage || Math.abs(pageNumber - currPage) < 2) {
                                return (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationLink isActive={active} href={`/dashboard/devices?page=${pageNumber}`} prefetch>
                                            {pageNumber}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            } else if (Math.abs(pageNumber - currPage) === 2) {
                                return (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }
                        })}
                        {currPage < maxPage &&
                            <PaginationItem>
                                <PaginationNext href={`/dashboard/devices?page=${currPage + 1}`} />
                            </PaginationItem>
                        }

                    </PaginationContent>
                </Pagination>

            </>

            }
            {devices.length === 0 && <EmptyDevices />}
        </div>
    );
}