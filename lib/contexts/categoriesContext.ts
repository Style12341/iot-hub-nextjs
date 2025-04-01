import { CreateCategoryFormData } from "@/types/types";
import db from "../prisma";
import { SensorCategory } from "@prisma/client";


export async function deleteCategory(userId: string, categoryId: string) {
    return await db.sensorCategory.delete({
        where: {
            id: categoryId,
            userId
        }
    });
}
export async function createCategory(data: CreateCategoryFormData): Promise<SensorCategory> {
    return await db.sensorCategory.create({
        data: {
            name: data.name,
            userId: data.userId
        }
    });
}
export async function editCategory(data: CreateCategoryFormData, categoryId: string): Promise<SensorCategory> {
    return await db.sensorCategory.update({
        where: {
            id: categoryId
        },
        data: {
            name: data.name,
            color: data.color,
        }
    });
}

export async function getUserCategories(userId: string): Promise<SensorCategory[]> {
    return await db.sensorCategory.findMany({
        where: {
            userId
        }
    });
}
export type SensorCategoryWithCount = SensorCategory & {
    sensorCount: number;
};

export async function getUserCategoriesWithSensorCount(userId: string): Promise<SensorCategoryWithCount[]> {
    // Raw SQL query to get the count of sensors in each category
    const categories = await db.sensorCategory.findMany({
        where: { userId },
        include: {
            _count: { select: { Sensor: true } }
        }
    });

    return categories.map((category) => ({
        ...category,
        sensorCount: category._count.Sensor
    }));
}