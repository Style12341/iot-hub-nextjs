"use client";

import { useBreadcrumbsEffect } from "@/lib/useBreadcrumbsEffect";

type BreadcrumbLink = {
    href: string;
    name: string;
};

interface BreadcrumbHandlerProps {
    breadcrumbs?: BreadcrumbLink[];
    page: string;
}

export default function BreadcrumbHandler({ breadcrumbs = [], page }: BreadcrumbHandlerProps) {
    // Apply breadcrumbs effect
    useBreadcrumbsEffect(breadcrumbs, page);

    // This component doesn't render anything visible
    return null;
}