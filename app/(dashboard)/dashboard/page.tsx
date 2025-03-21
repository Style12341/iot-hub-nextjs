import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";


export default function Dashboard() {
    return (
        <>
            {/* Client component that handles breadcrumbs */}
            <BreadcrumbHandler
                breadcrumbs={[{ href: '/dashboard', name: 'Dashboard' }]}
                page="Overview"
            />

            {/* Server component content */}
            <div>Dashboard</div>
        </>
    );

}
