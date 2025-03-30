'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FirmwareStatusIndicatorProps {
    isActive: boolean;
    isEmbedded?: boolean;
    tooltipText: string;
    interactive?: boolean;
    onClick?: () => void;
}

export function FirmwareStatusIndicator({
    isActive,
    isEmbedded,
    tooltipText,
    interactive = false,
    onClick
}: FirmwareStatusIndicatorProps) {
    interactive = interactive && !isEmbedded; // Disable interaction if embedded
    const Wrapper = interactive ? Button : 'div';
    const wrapperProps = interactive
        ? {
            variant: "ghost" as const,
            size: "sm" as const,
            onClick,
            className: "p-0 h-8 w-8 cursor-pointer"
        }
        : { className: "p-0 h-8 w-8 flex items-center justify-center" };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Wrapper {...wrapperProps}>
                        <span
                            className={cn(
                                "relative flex h-3 w-3 rounded-full",
                                isActive
                                    ? interactive
                                        ? "bg-blue-500" // Assigned - blue
                                        : "bg-green-500" // Active - green
                                    : "bg-slate-300" // Inactive - gray
                            )}
                        >
                            {isActive && (
                                <span
                                    className={cn(
                                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                        interactive ? "bg-blue-400" : "bg-green-400"
                                    )}
                                ></span>
                            )}
                        </span>
                    </Wrapper>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}