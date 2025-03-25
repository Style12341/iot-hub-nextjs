export const getDeviceEventSource = (deviceId: string) => {
    return new EventSource(`/api/v1/devices/${deviceId}/sse`);
}
export const getDevicesEventSource = (deviceIds: string[]) => {
    const url = `/api/v1/devices/sse?deviceIds=${deviceIds.join(',')}`;
    return new EventSource(url);
}
export const getDeviceChannel = (deviceId: string) => {
    return `device:${deviceId}`;
}
export const getSensorChannel = (sensorId: string) => `sensor:${sensorId}`;