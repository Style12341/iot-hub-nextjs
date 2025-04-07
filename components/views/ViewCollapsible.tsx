"use client";

import { useState, useEffect } from "react";
import { DeviceQueryResult } from "@/lib/contexts/deviceContext";
import { ChevronRight, ChevronDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import DeviceViewWrapper from "@/components/devices/DeviceViewWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getDevicesViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import { deleteViewAction } from "@/app/actions/viewActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface ViewCollapsibleProps {
    viewName: string;
    viewId: string;
    defaultExpanded?: boolean;
    deviceCount: number;
    isDefaultView?: boolean;
}

const defaultFetchDate = new Date(Date.now() - 1000 * 60 * 10); // Default to 10 minutes ago

export default function ViewCollapsible({
    viewName,
    viewId,
    deviceCount,
    defaultExpanded = false,
    isDefaultView = false
}: ViewCollapsibleProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [devices, setDevices] = useState<DeviceQueryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataFetched, setDataFetched] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch data when expanded and data hasn't been fetched yet
    useEffect(() => {
        if (isExpanded && !dataFetched && !isLoading) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    console.log(`Fetching data for ${viewName} view`);

                    const response = await getDevicesViewWithActiveSensorsBetweenAction(
                        viewName,
                        defaultFetchDate,
                        new Date(Date.now())
                    );

                    if (response.success) {
                        const deviceData = response.data.map(item => item.device);
                        setDevices(deviceData);
                        setDataFetched(true);
                    } else {
                        toast.error(`Failed to fetch devices for ${viewName} view`);
                    }
                } catch (error) {
                    console.error("Error fetching devices:", error);
                    toast.error("Error fetching devices. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
        if (!isExpanded) {
            setDataFetched(false);
            setDevices([]);
        }
    }, [isExpanded, viewName]);

    // Handler for view deletion
    const handleDeleteView = async () => {
        try {
            setIsDeleting(true);
            const result = await deleteViewAction(viewId);

            if (result.success) {
                toast.success("View deleted successfully");
                if (deviceCount > 0) {
                    toast.info(`${deviceCount} devices moved to Default view`);
                }
                router.refresh(); // Refresh the page to update the UI
            } else {
                toast.error(result.message || "Failed to delete view");
            }
        } catch (error) {
            console.error("Error deleting view:", error);
            toast.error("An error occurred while deleting the view");
        } finally {
            setIsDeleting(false);
            setIsDialogOpen(false);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded && deviceCount > 0)}
                        className="flex justify-start items-center p-0 h-auto"
                    >
                        <CardTitle className="text-xl flex items-center">
                            {isExpanded ?
                                <ChevronDown className="h-5 w-5 mr-2" /> :
                                <ChevronRight className="h-5 w-5 mr-2" />}
                            {viewName} View
                        </CardTitle>
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {deviceCount} {deviceCount === 1 ? "device" : "devices"}
                        </span>

                        {/* Action Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>View Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => toast.info("Edit functionality coming soon")}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                if (!isDefaultView) {
                                                    setIsDialogOpen(true);
                                                }
                                            }}
                                            disabled={isDefaultView}
                                            className={isDefaultView ? "text-muted-foreground cursor-not-allowed" : "text-destructive"}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                            {isDefaultView && (
                                                <span className="ml-2 text-xs">(Default View)</span>
                                            )}
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete {viewName} View?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {deviceCount > 0 ? (
                                                    <>
                                                        This view contains {deviceCount} {deviceCount === 1 ? "device" : "devices"}.
                                                        <span className="block mt-2 font-medium text-destructive">
                                                            All devices in this view will be moved to your Default view.
                                                        </span>
                                                    </>
                                                ) : (
                                                    "Are you sure you want to delete this view?"
                                                )}
                                                <p className="mt-2">This action cannot be undone.</p>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteView}
                                                disabled={isDeleting}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {isDeleting ? "Deleting..." : "Delete View"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CardContent className="pt-0">
                            {isLoading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                </div>
                            ) : dataFetched ? (
                                <DeviceViewWrapper
                                    initialDevices={devices}
                                    isExpanded={isExpanded}
                                />
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    No devices to display
                                </div>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}