import { ChartOptions } from 'chart.js';

/**
 * Color configuration for a chart series
 */
export interface ChartColorSet {
    border: string;
    background: string;
    point: string;
    pointHover: string;
    pointHoverBorder: string;
}

/**
 * Standard chart colors used throughout the application
 */
export const chartColors = {
    primary: {
        border: 'rgba(75, 192, 192, 1)',
        background: 'rgba(75, 192, 192, 0.2)',
        point: 'rgba(75, 192, 192, 1)',
        pointHover: 'rgba(75, 192, 192, 1)',
        pointHoverBorder: 'white',
    },
    secondary: {
        border: 'rgba(54, 162, 235, 1)',
        background: 'rgba(54, 162, 235, 0.2)',
        point: 'rgba(54, 162, 235, 1)',
        pointHover: 'rgba(54, 162, 235, 1)',
        pointHoverBorder: 'white',
    },
    tertiary: {
        border: 'rgba(255, 159, 64, 1)',
        background: 'rgba(255, 159, 64, 0.2)',
        point: 'rgba(255, 159, 64, 1)',
        pointHover: 'rgba(255, 159, 64, 1)',
        pointHoverBorder: 'white',
    },
};

/**
 * Generate a color set from a base color
 * 
 * @param baseColor - The base color in any CSS format (hex, rgb, etc)
 * @returns A color set suitable for charts
 */
export function generateColorSetFromBase(baseColor: string): ChartColorSet {
    return {
        border: baseColor,
        background: convertToRGBA(baseColor, 0.2),
        point: baseColor,
        pointHover: baseColor,
        pointHoverBorder: 'white',
    };
}

/**
 * Convert a color to RGBA format with specified opacity
 * 
 * @param color - The color in any CSS format (hex, rgb, etc)
 * @param opacity - The opacity value (0-1)
 * @returns RGBA color string
 */
function convertToRGBA(color: string, opacity: number): string {
    // If already in rgba format, just modify the opacity
    if (color.startsWith('rgba')) {
        return color.replace(/rgba\((.+),\s*[\d.]+\)/, `rgba($1, ${opacity})`);
    }

    // If in rgb format, convert to rgba
    if (color.startsWith('rgb')) {
        return color.replace(/rgb\((.+)\)/, `rgba($1, ${opacity})`);
    }

    // For hex and other formats, use a simple approach - fall back to semi-transparent version of the same color
    // In a real application, you might want to convert hex to rgb properly
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Standard dataset styling for line charts
 */
export const getLineDatasetStyle = (
    colorSet: ChartColorSet = chartColors.primary,
    filled = true
) => ({
    borderColor: colorSet.border,
    backgroundColor: filled ? colorSet.background : 'transparent',
    borderWidth: 2,
    pointRadius: 0.5,
    pointHitRadius: 5,
    pointBackgroundColor: colorSet.point,
    pointBorderColor: colorSet.point,
    pointHoverBackgroundColor: colorSet.pointHover,
    pointHoverBorderColor: colorSet.pointHoverBorder,
    pointHoverBorderWidth: 2,
    pointHoverRadius: 5,
    tension: 0,
    fill: filled,
});

/**
 * Standard time scale options for charts
 */
export const getTimeScaleOptions = (unit: 'minute' | 'hour' | 'day' = 'minute') => ({
    type: 'time' as const,
    time: {
        unit: unit,
        displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d',
        },
    },
    title: {
        display: true,
        text: 'Time',
    },
});

/**
 * Get standard chart options with customizable parameters
 * 
 * @param yAxisLabel - The label for the y-axis
 * @param showLegend - Whether to show the legend
 * @param tooltipCallback - Custom tooltip formatting function
 * @param allowNegativeValues - Whether to allow negative values on the y-axis (defaults to true)
 */
export const getStandardChartOptions = (
    yAxisLabel?: string,
    showLegend = true,
    tooltipCallback?: (context: any) => string,
    allowNegativeValues = true
): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: false,
    scales: {
        x: getTimeScaleOptions(),
        y: {
            title: {
                display: true,
                text: yAxisLabel || 'Value',
            },
            beginAtZero: !allowNegativeValues,
            min: allowNegativeValues ? undefined : 0,
            suggestedMin: allowNegativeValues ? undefined : 0,
        },
    },
    plugins: {
        legend: {
            display: showLegend,
            position: 'top' as const,
        },
        tooltip: {
            callbacks: {
                label: tooltipCallback || ((context: any) => `Value: ${context.parsed.y}`),
            },
        },
    },
});