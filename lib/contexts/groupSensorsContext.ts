import db from "../prisma";

export async function getGroupSensor(group_id: string, sensor_id: string) {
    return await db.groupSensor.findFirst({
        where: {
            groupId: group_id,
            sensorId: sensor_id
        }
    });
}
export async function getGroupSensors(group_id: string, sensor_ids: string[]) {
    return await db.groupSensor.findMany({
        where: {
            groupId: group_id
        }
    }).then(groupSensors => {
        return groupSensors.filter(groupSensor => sensor_ids.includes(groupSensor.sensorId))
    });
}