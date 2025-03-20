"use client";
import { useBreadcrumbsEffect } from "@/lib/useBreadcrumbsEffect";
import { useEffect } from "react";

export default function Dashboard() {
    // Set breadcrumbs in one line
    useBreadcrumbsEffect([
    ], 'Dashboard');
    return <div>Dashboard</div>
}
