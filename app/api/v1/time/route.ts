"use server"

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    return new NextResponse(JSON.stringify({ unix_time: Math.round(Date.now() / 1000) }), { status: 200 });
}