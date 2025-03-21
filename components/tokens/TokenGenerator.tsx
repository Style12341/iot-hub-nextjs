"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { CreateTokenFormData } from "@/types/types";
import { createTokenAction } from "@/app/actions/tokenActions";

interface TokenGeneratorProps {
    userId: string;
    context: string;
    title: string;
    description: string;
}

export default function TokenGenerator({ userId, context, title, description }: TokenGeneratorProps) {
    const [token, setToken] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // This function can be safely called from a client component
    // when createTokenAction is a server action
    const handleCreateToken = async () => {
        setIsLoading(true);
        try {
            const data: CreateTokenFormData = {
                userId,
                context
            };

            // Next.js will automatically handle calling the server action
            const response = await createTokenAction(data);

            if (response?.success) {
                setToken(response.data);
                toast.success("Token created successfully");
            } else {
                toast.error("Failed to create token", {
                    description: response?.message || "Unknown error"
                });
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(token);
        toast.success("Token copied to clipboard");
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`token-${context}`}>API Token</Label>
                    <div className="flex gap-2">
                        <Input
                            id={`token-${context}`}
                            value={token}
                            readOnly
                            placeholder="No token generated yet"
                            className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap"
                            title={token} // Shows full token on hover
                        />
                        {token && (
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <Button
                    onClick={() => setIsDialogOpen(true)}
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? "Generating..." : "Generate New Token"}
                </Button>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will invalidate any existing token for this context.
                                All devices using the previous token will need to be updated.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    handleCreateToken();
                                }}
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}