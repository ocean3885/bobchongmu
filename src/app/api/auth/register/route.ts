import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, login } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
        if (existing) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);
        const info = db
            .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
            .run(username, hashedPassword);

        const userId = info.lastInsertRowid as number;
        await login({ id: userId, username });

        return NextResponse.json({ success: true, user: { id: userId, username } });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
