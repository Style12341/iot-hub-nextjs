import BreadcrumbHandler from "@/components/dashboard/BreadcrumbHandler";
import TokenGenerator from "@/components/tokens/TokenGenerator";
import { useBreadcrumbsEffect } from "@/lib/useBreadcrumbsEffect";
import { LOGTOKEN } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardSettingsPage() {
    const { userId } = await auth();
    if (!userId) {
        return redirect("/login");
    }
    return (
        <>
            <BreadcrumbHandler
                page="Settings"
            />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Settings</h1>

                <div className="grid gap-6">
                    <TokenGenerator
                        userId={userId || ''}
                        context={LOGTOKEN}
                        title="Logging API Token"
                        description="Use this token to authenticate your devices when sending sensor data."
                    />
                </div>
            </div>
        </>
    );
}