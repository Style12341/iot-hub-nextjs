"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    InfoIcon,
    SettingsIcon,
    LineChartIcon,
    ListIcon,
    GroupIcon,
    MicrochipIcon,
    MoreVerticalIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type NavItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

interface DeviceMenuProps {
    deviceId: string;
    activeTab?: string;
    variant?: "default" | "dropdown" | "responsive";
    dropdownButtonVariant?: "default" | "ghost" | "outline";
    dropdownButtonSize?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export default function DeviceMenu({
    deviceId,
    activeTab,
    variant = "responsive", // Changed default to responsive
    dropdownButtonVariant = "outline",
    dropdownButtonSize = "icon",
    className
}: DeviceMenuProps) {
    const pathname = usePathname();
    // State to track if the viewport is mobile sized
    const [isMobile, setIsMobile] = useState(false);

    // Effect to check viewport size on mount and window resize
    useEffect(() => {
        // Function to check if viewport is mobile sized
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIsMobile();

        // Set up listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const navItems: NavItem[] = [
        {
            href: `/dashboard/devices/${deviceId}`,
            label: "Overview",
            icon: <InfoIcon className="h-4 w-4" />
        },
        {
            href: `/dashboard/devices/${deviceId}/sensors`,
            label: "Sensors",
            icon: <LineChartIcon className="h-4 w-4" />
        },
        {
            href: `/dashboard/devices/${deviceId}/groups`,
            label: "Groups",
            icon: <GroupIcon className="h-4 w-4" />
        },
        {
            href: `/dashboard/devices/${deviceId}/firmwares`,
            label: "Firmwares",
            icon: <MicrochipIcon className="h-4 w-4" />
        },
        {
            href: `/dashboard/devices/${deviceId}/settings`,
            label: "Settings",
            icon: <SettingsIcon className="h-4 w-4" />
        }
    ];

    // Determine if we should show dropdown based on variant prop or mobile detection
    const showDropdown = variant === "dropdown" || (variant === "responsive" && isMobile);

    // Render dropdown if explicitly requested or on mobile with responsive variant
    if (showDropdown) {
        return (
            <DropdownMenu >
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={dropdownButtonVariant}
                        size={dropdownButtonSize}
                        className={className}
                        aria-label="Device actions"
                    >
                        <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" alignOffset={20} className="w-48">
                    {navItems.map((item) => {
                        const isActive =
                            (item.label.toLowerCase() === activeTab) ||
                            (pathname === item.href);

                        return (
                            <DropdownMenuItem
                                key={item.href}
                                asChild
                                className={cn(
                                    "cursor-pointer",
                                    isActive && "bg-muted font-medium"
                                )}
                            >
                                <Link href={item.href} className="flex items-center w-full">
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Default horizontal navigation for desktop or when explicitly requested
    return (
        <nav className={cn("flex overflow-x-auto pb-2", className)}>
            <div className="flex space-x-1 rounded-md bg-muted p-1">
                {navItems.map((item) => {
                    const isActive =
                        (item.label.toLowerCase() === activeTab) ||
                        (pathname === item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            {item.icon}
                            <span className="ml-2">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}