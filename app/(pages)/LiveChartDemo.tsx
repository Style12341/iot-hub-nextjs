"use client";

import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

export function LiveChartDemo() {
    const [data, setData] = useState(() => {
        // Generate initial data with the last 30 points
        const now = Date.now();
        const points = [];
        for (let i = 0; i < 30; i++) {
            points.push({
                x: new Date(now - (30 - i) * 1000),
                y: Math.random() * 20 + 50 // Random value between 50-70
            });
        }
        return points;
    });

    // Update data every second to simulate real-time
    useEffect(() => {
        const interval = setInterval(() => {
            setData(prevData => {
                const newData = [...prevData];
                // Add new point
                newData.push({
                    x: new Date(),
                    y: Math.random() * 20 + 50 // Random value between 50-70
                });
                // Remove oldest point
                if (newData.length > 30) {
                    newData.shift();
                }
                return newData;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const chartData = {
        datasets: [
            {
                label: 'Temperature',
                data: data,
                borderColor: 'rgb(117, 194, 198)',
                backgroundColor: 'rgba(117, 194, 198, 0.1)',
                fill: true,
                cubicInterpolationMode: "monotone" as const,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: "time" as const,
                time: {
                    unit: 'second' as const,
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                min: 40,
                max: 80,
                title: {
                    display: true,
                    text: 'Temperature (°C)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context: { parsed: { y: number } }) => `${context.parsed.y.toFixed(1)} °C`,
                }
            }
        },
        animation: {
            duration: 200,
            easing: 'easeInQuad' as const
        }
    };

    return (
        <div className="relative h-[400px] overflow-hidden rounded-lg border border-border shadow-xl bg-background/95 p-4">
            <Line data={chartData} options={options} />
        </div>
    );
}