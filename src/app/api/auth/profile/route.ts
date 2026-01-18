import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { nickname } = await req.json();

        // Update user in DB
        db.prepare("UPDATE users SET nickname = ? WHERE id = ?").run(nickname || null, session.user.id);

        return NextResponse.json({ success: true, nickname });
    } catch (error) {
        console.error("Failed to update profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
