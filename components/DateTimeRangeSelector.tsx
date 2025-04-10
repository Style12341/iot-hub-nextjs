"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type DateTimeRangeProps = {
    dateRange: { start: Date; end: Date };
    onDateRangeChange: (range: { start: Date; end: Date }) => void;
    onApply: () => void;
};

export function DateTimeRangeSelector({
    dateRange,
    onDateRangeChange,
    onApply
}: DateTimeRangeProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Quick selection options
    const quickOptions = [
        {
            label: "Last hour", value: "1h",
            fn: () => {
                const end = new Date();
                const start = new Date(end.getTime() - 60 * 60 * 1000);
                onDateRangeChange({ start, end });
            }
        },
        {
            label: "Last 6 hours", value: "6h",
            fn: () => {
                const end = new Date();
                const start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
                onDateRangeChange({ start, end });
            }
        },
        {
            label: "Last 24 hours", value: "24h",
            fn: () => {
                const end = new Date();
                const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                onDateRangeChange({ start, end });
            }
        },
        {
            label: "Last 7 days", value: "7d",
            fn: () => {
                const end = new Date();
                const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                onDateRangeChange({ start, end });
            }
        },
        {
            label: "Last 30 days", value: "30d",
            fn: () => {
                const end = new Date();
                const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                onDateRangeChange({ start, end });
            }
        },
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Date Range</Label>
                <Select onValueChange={(value) => {
                    const option = quickOptions.find(opt => opt.value === value);
                    if (option) option.fn();
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        {quickOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Custom Range</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange ? (
                                <>
                                    {format(dateRange.start, "PPP")} - {format(dateRange.end, "PPP")}
                                </>
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={{
                                from: dateRange.start,
                                to: dateRange.end,
                            }}
                            onSelect={(range) => {
                                if (range?.from && range?.to) {
                                    // Set time to beginning/end of day
                                    const start = new Date(range.from);
                                    start.setHours(0, 0, 0, 0);

                                    const end = new Date(range.to);
                                    end.setHours(23, 59, 59, 999);

                                    onDateRangeChange({ start, end });
                                }
                            }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}