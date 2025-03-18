import { CreateCategoryFormData } from "@/types/types";
import db from "../prisma";
import { SensorCategory } from "@prisma/client";

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
            name: data.name
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