import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface GroupStatusIndicatorProps {
    isActive: boolean;
    tooltipText: string;
    interactive?: boolean;
    onClick?: () => void;
}

export function GroupStatusIndicator({
    isActive,
    tooltipText,
    interactive = false,
    onClick
}: GroupStatusIndicatorProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center",
                            interactive && !isActive && "cursor-pointer hover:opacity-70"
                        )}
                        onClick={interactive ? onClick : undefined}
                    >
                        {isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500 fill-green-500/20" />
                        ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}