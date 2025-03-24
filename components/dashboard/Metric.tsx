'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMetricValueBetween } from "@/lib/contexts/metricsContext";
import { Metrics } from "@prisma/client";
import { ResponsiveContainer } from "recharts";


// Types
type MetricProps = {
    title: string;
    description?: string;
    variant: 'graph' | 'number';
    className?: string;
    icon?: React.ReactNode;
} & (GraphMetricProps | NumberMetricProps);
type TimeSeries = {
    timestamp: Date | string;
    value: number;
};

type GraphMetricProps = {
    variant: 'graph';
    data: Array<TimeSeries>;
    loading?: boolean;
    timeRangeText?: string;
    yAxisLabel?: string;
    height?: number;
} & ({
    metricName: Metrics;
    fetchInterval: number;
} | {
    metricName: never;
    fetchInterval: never;
});

type NumberMetricProps = {
    variant: 'number';
    value: number;
    previousValue?: number;
    formatValue?: (value: number) => string;
    prefix?: string;
    unit?: string;  // New unit property that displays alongside the number
    suffix?: React.ReactNode;  // Changed from string to ReactNode
    loading?: boolean;
    trendDirection?: 'up' | 'down' | 'neutral';
};

export default function Metric(props: MetricProps) {
    const { title, description, variant, className, icon } = props;

    return (
        <Card className={cn("overflow-hidden", className, "h-auto")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {icon || <BarChart3 className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                {variant === 'graph' ? (
                    <GraphMetric {...(props as GraphMetricProps)} />
                ) : (
                    <NumberMetric {...(props as NumberMetricProps)} />
                )}
            </CardContent>
        </Card>
    );
}

function GraphMetric({ data, metricName, fetchInterval, loading, timeRangeText, height = 200 }: GraphMetricProps) {
    // 1. Move all hooks to the top before any conditionals
    const { userId } = useAuth();

    // Format the data for Recharts first
    const formattedData = data?.map(item => ({
        timestamp: new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }),
        value: item.value
    })) || [];

    // Always declare useState no matter what
    const [chartData, setChartData] = useState(formattedData);

    // Always call useEffect
    useEffect(() => {
        if (metricName && userId) {
            console.log('Starting interval');
            const interval = setInterval(async () => {
                try {
                    const newData = await getMetricValueBetween(metricName, userId, new Date(Date.now() - fetchInterval * 2), new Date());
                    const formattedData = newData.map(item => ({
                        timestamp: new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        value: item.value
                    }));
                    console.log('Old data', chartData);
                    console.log('New data:', formattedData);
                    //Append new data to the chart
                    setChartData(prevData => [...prevData.slice(-4), ...formattedData].slice(-5));
                } catch (error) {
                    console.error('Error fetching metric data:', error);
                }
            }, fetchInterval);
            return () => clearInterval(interval);
        }
    }, [userId, metricName, fetchInterval]);

    // 2. Now handle conditional returns after all hooks
    if (loading) {
        return <div className="flex justify-center items-center h-[200px]">Loading...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center text-muted-foreground py-8">No data available</div>;
    }

    if (!userId) {
        return <div className="text-center text-muted-foreground py-8">No user ID available</div>;
    }

    const chartConfig = {
        value: {
            label: "Value",
            color: "var(--color-chart-1)",
        },
    } satisfies ChartConfig;

    // Rest of the component remains the same...
    return (
        <>
            <div style={{ minHeight: "150px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={height}>
                    <ChartContainer config={chartConfig}>
                        <LineChart
                            data={chartData}
                            margin={{
                                left: 5,
                                right: 5,
                                top: 5,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
                            <XAxis
                                dataKey="timestamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Line
                                dataKey="value"
                                type="monotone"
                                strokeWidth={2}
                                stroke="var(--color-chart-1)"
                                dot={{
                                    fill: "var(--color-chart-1)",
                                    r: 3,
                                }}
                                activeDot={{
                                    r: 5,
                                    fill: "var(--color-chart-1)",
                                }}
                            />
                        </LineChart>
                    </ChartContainer>
                </ResponsiveContainer>
            </div>

            <CardFooter className="flex-col items-start gap-2 text-sm pt-3 px-0">
                {timeRangeText && (
                    <div className="leading-none text-muted-foreground">
                        {timeRangeText}
                    </div>
                )}
            </CardFooter>
        </>
    );
}

function NumberMetric({ value, previousValue, formatValue, prefix, unit, suffix, loading, trendDirection }: NumberMetricProps) {
    if (loading) {
        return <div className="h-[120px] flex items-center justify-center">Loading...</div>;
    }

    const formattedValue = formatValue ? formatValue(value) : value.toLocaleString();

    // Calculate percentage change if both values are provided
    let percentChange = 0;
    let calculatedTrendDirection: 'up' | 'down' | 'neutral' = trendDirection || 'neutral';

    if (previousValue !== undefined && previousValue !== 0) {
        percentChange = ((value - previousValue) / previousValue) * 100;

        if (!trendDirection) {
            calculatedTrendDirection = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {prefix && <span className="text-3xl font-bold ">{prefix}</span>}
                    <span className="text-3xl font-bold ">{formattedValue}</span>
                    {unit && <span className="ml-1 text-lg font-normal text-muted-foreground">{unit}</span>}
                </div>
                {suffix && <div>{suffix}</div>}
            </div>

            {previousValue !== undefined && (
                <CardFooter className="flex-col items-start gap-2 text-sm px-0 pt-3">
                    <div className={cn(
                        "flex gap-2 font-medium leading-none",
                        calculatedTrendDirection === 'up' && "text-emerald-500",
                        calculatedTrendDirection === 'down' && "text-rose-500"
                    )}>
                        {calculatedTrendDirection === 'up' ? 'Trending up' : calculatedTrendDirection === 'down' ? 'Trending down' : 'No change'} by {Math.abs(percentChange).toFixed(1)}%
                        {calculatedTrendDirection === 'up' ?
                            <TrendingUp className="h-4 w-4" /> :
                            calculatedTrendDirection === 'down' ?
                                <TrendingDown className="h-4 w-4" /> :
                                <Minus className="h-4 w-4" />
                        }
                    </div>
                    <div className="leading-none text-muted-foreground">
                        Compared to previous period
                    </div>
                </CardFooter>
            )}
        </div>
    );
}