"use client";

import Link from "next/link";
import { SidebarMenuSubButton } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarLinkProps {
    href: string;
    children: React.ReactNode;
}

export default function SidebarLink({ href, children }: SidebarLinkProps) {
    const { toggleSidebar } = useSidebar();

    const handleClick = () => {
        console.log(window.innerWidth);
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    };

    return (
        <SidebarMenuSubButton asChild>
            <Link href={href} onClick={handleClick}>{children} </Link>
        </SidebarMenuSubButton>
    );
}