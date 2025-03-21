import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import "../globals.css";
import { Separator } from "@/components/ui/separator"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import { BreadcrumbProvider } from "@/lib/BreadcrumbContext"
export default function RootLayout({
    children }: { children: React.ReactNode }) {
    return (
        <>
            <html lang="en" suppressHydrationWarning>
                <head />
                <body>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <SidebarProvider>
                            <ClerkProvider>
                                <BreadcrumbProvider>
                                    <DashboardSidebar />
                                    <SidebarInset>
                                        <DashboardHeader />
                                        <div className="p-4 lg:p-6">
                                            {children}
                                        </div>
                                        <Toaster richColors={true} closeButton/>
                                    </SidebarInset>
                                </BreadcrumbProvider>
                            </ClerkProvider>
                        </SidebarProvider>
                    </ThemeProvider>
                </body>
            </html>
        </>

    )
}