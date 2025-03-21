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
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    };

    return (
        <Link href={href} onClick={handleClick}>{children} </Link>
    );
}