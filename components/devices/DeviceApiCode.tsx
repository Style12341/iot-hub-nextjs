"use client"

import { DeviceGroupsWithSensorsIds } from "@/lib/contexts/deviceContext"
import { useEffect, useState } from "react"
import { CodeBlock } from "../CodeBlock"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

type DeviceApiCodeProps = {
    device: DeviceGroupsWithSensorsIds
}

export default function DeviceApiCode({ device }: DeviceApiCodeProps) {
    // This component will show the code for the API calls to the device
    const [group, setGroup] = useState(device.Groups.find((g) => g.active))
    const [code, setCode] = useState<string>(`{}`)
    useEffect(() => {
        setCode(
            `{
        "device_id": "${device.id}",
        "group_id": "${group?.id || "group_id"}",
        "firmwareVersion": "${device.firmwareVersion}", // Current firmware version here
        "fast": false, // Optional, if true, the server will answer faster but no errors will be returned
        "sensors": [${group?.sensor.map((sensor) => `
                {
                    "sensor_id": "${sensor.id}", // Sensor ID for: ${sensor.name}
                    "value": 123.0, // Insert value here
                    "timestamp": ${Math.round(Date.now() / 1000)} // Unix timestamp, if not provided, the server will use the current timestamp
                }`).join(",") || ""}
        ]
    }`

        )
    }, [group]);


    return <>
        <h2 className="text-2xl font-bold tracking-tight">Device API Code</h2>
        <p className="text-muted-foreground">This is the code you need to send to the device to update its state.
            <br /> You can use this code in your application to send data to the device.

        </p>
        <div className="flex flex-col gap-4 mb-4">
            <Label htmlFor="group" className="text-sm font-medium">Select group</Label>
            <Select onValueChange={(value) => setGroup(device.Groups.find((g) => g.id === value))}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={group?.name} />
                </SelectTrigger>
                <SelectContent>
                    {device.Groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}  >{g.name} </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <CodeBlock code={code} language="json" className="w-full" />
    </>
}