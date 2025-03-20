import { createDeviceAction } from "@/app/actions/deviceActions";
import { CreateDeviceFormData } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";

// Create device api
export async function POST(req: NextRequest) {
    if (!req.json) {
        return new NextResponse('Error: bad request', {
            status: 400,
        })
    }
    const body: CreateDeviceFormData = await req.json();

    const response = await createDeviceAction(body);
    if (!response.success) {
        return new NextResponse(response.message, {
            status: response.statusCode,
        })
    }
    const device = response.data;
    return new NextResponse(JSON.stringify(device), {
        status: 201,
        headers: {
            'Content-Type': 'application/json'
        }
    })

}