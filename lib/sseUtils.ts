// Store EventSource instances and their subscribers
const eventSources = new Map<string, EventSource>();
type EventCallback = (data: any) => void;
const eventSubscribers = new Map<string, Set<EventCallback>>();

/**
 * Get or create an EventSource for the specified device IDs and subscribe to its events
 * @param deviceIds Array of device IDs to subscribe to
 * @param callback Function to be called when events are received
 * @returns Function to unsubscribe from events
 */
export const subscribeToDeviceEvents = (deviceIds: string[], callback: EventCallback) => {
    const key = deviceIds.sort().join(',');

    // Create a set of subscribers if it doesn't exist
    if (!eventSubscribers.has(key)) {
        eventSubscribers.set(key, new Set());
    }

    // Add this callback to subscribers
    eventSubscribers.get(key)!.add(callback);

    // Create EventSource if it doesn't exist
    if (!eventSources.has(key)) {
        const url = `/api/v1/devices/sse?deviceIds=${key}`;
        console.log(`Creating new SSE connection for devices: ${key}`);

        const source = new EventSource(url);

        // Set up a single onmessage handler that forwards to all subscribers
        source.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Forward the event to all subscribers
                eventSubscribers.get(key)?.forEach(subscriber => {
                    try {
                        subscriber(data);
                    } catch (err) {
                        console.error('Error in subscriber callback:', {
                            err,
                            body: {
                                event: event.data,
                                key,
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("Error parsing SSE data:", { error, body: { event: event.data, key } });
            }
        };

        source.onerror = (error) => {
            console.error(`SSE connection error for devices ${key}:`, {
                error, body: {
                    key,
                }
            });
            // Wait before cleaning up to prevent immediate reconnection attempts
            setTimeout(() => {
                if (source.readyState === EventSource.CLOSED) {
                    cleanupEventSource(key);
                }
            }, 1000);
        };

        eventSources.set(key, source);
    } else {
        console.log(`Reusing existing SSE connection for devices: ${key}`);
    }

    // Return unsubscribe function
    return () => {
        const subscribers = eventSubscribers.get(key);
        if (subscribers) {
            subscribers.delete(callback);

            // If no more subscribers, clean up the EventSource
            if (subscribers.size === 0) {
                cleanupEventSource(key);
            }
        }
    };
};

/**
 * Clean up an EventSource and its subscribers
 * @param key The key identifying the EventSource
 */
function cleanupEventSource(key: string) {
    const source = eventSources.get(key);
    if (source) {
        console.log(`Closing SSE connection for devices: ${key}`);
        source.close();
        eventSources.delete(key);
        eventSubscribers.delete(key);
    }
}

/**
 * Close all EventSource connections
 * Useful for cleanup on application exit
 */
export const closeAllEventSources = () => {
    eventSources.forEach((source, key) => {
        cleanupEventSource(key);
    });
};

/**
 * Get the channel name for a device
 * @param deviceId Device ID
 * @returns Channel name for the device
 */
export const getDeviceChannel = (deviceId: string) => {
    return `device:${deviceId}`;
};

/**
 * Get the channel name for a sensor
 * @param sensorId Sensor ID
 * @returns Channel name for the sensor
 */
export const getSensorChannel = (sensorId: string) => `sensor:${sensorId}`;