import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ user: null });
    }

    // Fetch fresh user data from DB
    const user = db.prepare("SELECT id, username, nickname FROM users WHERE id = ?").get(session.user.id);

    if (!user) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
}
