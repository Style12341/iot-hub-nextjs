'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMetricValueBetween } from "@/lib/contexts/metricsContext";
import { Metrics } from "@prisma/client";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import 'chartjs-adapter-date-fns';
import { getLineDatasetStyle, getStandardChartOptions } from "@/lib/chartConfig";
import { toast } from "sonner";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

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
    unit?: string;
    suffix?: React.ReactNode;
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

function GraphMetric({ data, metricName, fetchInterval, loading, timeRangeText, yAxisLabel, height = 200 }: GraphMetricProps) {
    const { userId } = useAuth();

    // Format the data for Chart.js
    const formatChartData = (dataPoints: TimeSeries[]) => {
        return dataPoints.map(item => ({
            x: new Date(item.timestamp),
            y: item.value
        }));
    };

    const [chartData, setChartData] = useState(formatChartData(data || []));

    useEffect(() => {
        // Update chart data when props.data changes
        setChartData(formatChartData(data || []));
    }, [data]);

    useEffect(() => {
        if (metricName && userId) {
            const interval = setInterval(async () => {
                try {
                    const newData = await getMetricValueBetween(metricName, userId, new Date(Date.now() - fetchInterval * 2), new Date());
                    const formattedData = formatChartData(newData);
                    // replace last two data points with new data
                    setChartData(prev => [...prev.slice(-4), ...formattedData]);
                } catch (error) {
                    toast.error("Error fetching metric data", {
                        description: "There was an error fetching the metric data. Please try again later."
                    });
                    console.error('Error fetching metric data:', error);
                }
            }, fetchInterval);
            return () => clearInterval(interval);
        }
    }, [userId, metricName, fetchInterval]);

    if (loading) {
        return <div className="flex justify-center items-center h-[200px]">Loading...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center text-muted-foreground py-8">No data available</div>;
    }

    const chartDataConfig = {
        datasets: [
            {
                label: "Value",
                data: chartData,
                ...getLineDatasetStyle() // Using shared style with fill
            },
        ],
    };

    // Get standard options with legend disabled and no negative values
    const options = getStandardChartOptions(yAxisLabel, false, undefined, false);

    return (
        <>
            <div style={{ height: `${height}px`, width: '100%' }}>
                <Line data={chartDataConfig} options={options} />
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
                    {prefix && <span className="text-3xl font-bold">{prefix}</span>}
                    <span className="text-3xl font-bold">{formattedValue}</span>
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