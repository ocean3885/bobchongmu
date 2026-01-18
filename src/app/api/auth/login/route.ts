import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, login } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
        if (!user || !(await verifyPassword(password, user.password))) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        await login({ id: user.id, username: user.username });

        return NextResponse.json({
            success: true,
            user: { id: user.id, username: user.username },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
