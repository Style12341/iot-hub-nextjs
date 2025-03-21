"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function EmptyDevices() {
    return (
        <Card className="p-8 text-center">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">No devices found</h3>
                <p className="text-sm text-muted-foreground">
                    You haven't created any devices yet. Start by adding your first device.
                </p>
                <Button asChild>
                    <Link href="/dashboard/devices/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Device
                    </Link>
                </Button>
            </div>
        </Card>
    );
}