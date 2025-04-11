"use client";
import { UserButton, useUser } from "@clerk/nextjs";

export default function CustomUserButton() {
    const { user } = useUser();

    return (
        <div className="flex items-center gap-2">
            <UserButton showName={false} />
            {user && (
                <span className="text-primary font-medium">
                    {user.firstName || user.username}
                </span>
            )}
        </div>
    );
}
