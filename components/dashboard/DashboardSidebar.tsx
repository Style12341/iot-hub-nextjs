import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible"
import { ChevronRight, Minus, Plus } from "lucide-react"
import { title } from "process"
import SidebarLink from "./SideBarLink"
// This is sample data.
const data = {
    versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
    navMain: [
        {
            title: "Dashboard",
            defaultOpen: true,
            url: "#",
            items: [
                {
                    title: "Overview",
                    url: "/dashboard",
                }, {
                    title: "Views",
                    url: "/dashboard/views",
                }, {
                    title: "New View",
                    url: "/dashboard/views/new",
                }
            ],
        }, {
            title: "Devices",
            defaultOpen: true,
            url: "#",
            items: [
                {
                    title: "All Devices",
                    url: "/dashboard/devices",
                },
                {
                    title: "New Device",
                    url: "/dashboard/devices/new",
                },
                {
                    title: "Categories",
                    url: "/dashboard/categories",
                },
                {
                    title: "New Category",
                    url: "/dashboard/categories/new",
                }
            ],
        }

    ],
}
export function DashboardSidebar() {
    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link href="#">
                                <span className="text-base font-semibold">IoT Hub</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {data.navMain.map((item, index) => (
                            <Collapsible
                                key={item.title}
                                defaultOpen={item.defaultOpen}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            {item.title}{" "}
                                            <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                                            <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    {item.items?.length ? (
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((item) => (
                                                    <SidebarMenuSubItem key={item.title}>
                                                        <SidebarMenuSubButton asChild>
                                                            <SidebarLink href={item.url}>
                                                                {item.title}
                                                            </SidebarLink>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    ) : null}
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <SidebarLink href="/dashboard/graph">Graph</SidebarLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <SidebarLink href="/dashboard/settings">Settings</SidebarLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
            </SidebarFooter>
        </Sidebar>
    )
}
