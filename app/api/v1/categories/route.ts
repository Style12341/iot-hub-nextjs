import { createCategoryAction } from "@/app/actions/categoryActions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    if (!req.json) {
        return new NextResponse('Error: bad request', {
            status: 400,
        })
    }
    const body = await req.json();
    const category = await createCategoryAction(body);
    if (!category.success) {
        return new NextResponse(category.message, {
            status: category.statusCode,
        })
    }
    return new NextResponse(JSON.stringify(category.data), {
        status: 201,
        headers: {
            'Content-Type': 'application/json'
        }
    })
}