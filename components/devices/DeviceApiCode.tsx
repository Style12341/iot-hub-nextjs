"use client"

import { DeviceGroupsWithSensorsIds } from "@/lib/contexts/deviceContext"
import { useEffect, useState } from "react"
import { CodeBlock } from "../CodeBlock"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { cn } from "@/lib/utils"

type DeviceApiCodeProps = {
    device: DeviceGroupsWithSensorsIds
}

export default function DeviceApiCode({ device }: DeviceApiCodeProps) {
    const [group, setGroup] = useState(device.Groups.find((g) => g.active))
    const [hasFast, setHasFast] = useState(false)
    const [activeTab, setActiveTab] = useState("raw")
    const [rawCode, setRawCode] = useState<string>(`{}`)
    const [postmanCode, setPostmanCode] = useState<string>(`{}`)
    const [espCode, setEspCode] = useState<string>(`{}`)

    // Render everything when the component mounts to avoid react hydration issues
    useEffect(() => {
        // Raw JSON code
        setRawCode(
            `{
    "device_id": "${device.id}", // Device ID for: ${device.name}
    "group_id": "${group?.id || "group_id"}", // Group ID for: ${group?.name || "group_name"}
    "firmware_version": "${device.firmwareVersion}", // Current firmware version here
    "fast": ${hasFast}, // Optional, if true, the server will answer faster but no errors will be returned
    "sensors": [${group?.sensor.map((sensor) => `
            {
                "sensor_id": "${sensor.id}", // Sensor ID for: ${sensor.name}
                "sensor_values": [
                    {
                        "value": ${Math.round(Math.random() * 2000) / 100}, // Sensor value here
                        "timestamp": ${Math.round(Date.now() / 1000)} // Unix timestamp here
                    }
                    // Additional values can be added to this array as needed
                ]
            }`).join("") || ""}
    ]
}`
        )

        // Postman code
        setPostmanCode(
            `{
    "device_id": "${device.id}", // Device ID for: ${device.name}
    "group_id": "${group?.id || "group_id"}", // Group ID for: ${group?.name || "group_name"}
    "firmware_version": "${device.firmwareVersion}", // Current firmware version here
    "fast": ${hasFast}, // Optional, if true, the server will answer faster but no errors will be returned
    "sensors": [${group?.sensor.map((sensor) => `
            {
                "sensor_id": "${sensor.id}", // Sensor ID for: ${sensor.name}
                "sensor_values": [
                    {
                        "value": {{$randomInt}}, // Will be replaced by Postman with a random integer
                        "timestamp": {{$timestamp}} // Will be replaced by Postman with current timestamp
                    }
                    // Additional values can be added to this array as needed
                ]
            }`).join("") || ""}
    ]
}`)
        const formatName = (name: string) => {
            return name.toLocaleLowerCase().split(" ").join("_")
        }
        // ESP32 SDK code
        setEspCode(
            `#include <Arduino.h>
// On firmware uploads to the page update the version to match the one on the server
#define FIRMWARE_VERSION "${device.firmwareVersion}"
#include "Logger.h"
#define API_KEY "${"YOUR_API_KEY"}"

// Create the logger with the amount of sensors
ESPLogger<${group?.sensor.length}> logger = ESPLogger<${group?.sensor.length}>("${device.id}");

// Create sensors, replace the lambda expression with your read function
${group?.sensor.map((sensor) => `Sensor ${formatName(sensor.name)} = Sensor("${sensor.id}", "${sensor.name}", "${sensor.unit}", "${sensor.category}", [](){return (float)${Math.round(Math.random() * 2000) / 100};});`
            ).join("\n") || ""}

void setupLogger() {
  ${group?.sensor.map((sensor) => `logger.addSensor(${formatName(sensor.name)});`).join("\n  ") || ""}
  logger.init(API_KEY,"${formatName(device.name)}","${group?.id}");
  // With this configuration the logger will send 6 readings per sensor per minute
  logger.setLogInterval(30);        // Interval in seconds to send data to the server
  logger.setSensorReadInterval(10); // Interval in seconds to read the sensors
}

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi here
  //...
  // Setup logger

  setupLogger();
}

void loop() {
  // Calling logger.tick() will send the data to the server periodically
  logger.tick();
}`

        )
    }, [group, hasFast, device]);

    return (
        <>
            <div className="flex flex-col gap-4 mb-4">
                <Label htmlFor="group" className="text-sm font-medium">Select group</Label>
                <Select onValueChange={(value) => setGroup(device.Groups.find((g) => g.id === value))}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={group?.name} />
                    </SelectTrigger>
                    <SelectContent>
                        {device.Groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="">
                    <Tooltip>
                        <TooltipTrigger asChild disabled={activeTab !== "esp32"}>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="fast" className={cn("text-sm font-medium", activeTab === "esp32" ? "text-muted-foreground" : "")}>Fast mode</Label>
                                <Checkbox
                                    id="fast"
                                    checked={hasFast}
                                    onCheckedChange={(e) => setHasFast(e === true)}
                                    disabled={activeTab === "esp32"}
                                />
                            </div>
                        </TooltipTrigger>
                        {activeTab === "esp32" && (
                            <TooltipContent side="right">
                                <p className="text-sm">Fast mode is handled by the SDK</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </div>

            <div className="w-full">
                <div className="flex space-x-1 rounded-lg bg-muted p-1">
                    <button
                        className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors
            ${activeTab === 'raw'
                                ? 'bg-background shadow'
                                : 'hover:bg-muted-foreground/10'}`}
                        onClick={() => setActiveTab('raw')}
                    >
                        Raw JSON
                    </button>
                    <button
                        className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors
            ${activeTab === 'postman'
                                ? 'bg-background shadow'
                                : 'hover:bg-muted-foreground/10'}`}
                        onClick={() => setActiveTab('postman')}
                    >
                        Postman
                    </button>
                    <button
                        className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors
            ${activeTab === 'esp32'
                                ? 'bg-background shadow'
                                : 'hover:bg-muted-foreground/10'}`}
                        onClick={() => setActiveTab('esp32')}
                    >
                        ESP32 SDK
                    </button>
                </div>

                <div className="relative">
                    <div className={activeTab === 'raw' ? 'block' : 'hidden'}>
                        <div key="raw-wrapper">
                            <CodeBlock code={rawCode} language="json" className="w-full" />
                        </div>
                    </div>
                    <div className={activeTab === 'postman' ? 'block' : 'hidden'}>
                        <div key="postman-wrapper">
                            <CodeBlock code={postmanCode} language="json" className="w-full" />
                        </div>
                    </div>
                    <div className={activeTab === 'esp32' ? 'block' : 'hidden'}>
                        <div key="esp-wrapper">
                            <CodeBlock code={espCode} language="cpp" className="w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}