import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const { pathname } = request.nextUrl;

    // Define public routes
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isApiAuth = pathname.startsWith("/api/auth");

    if (isAuthPage || isApiAuth) {
        if (session && isAuthPage) {
            // If already logged in and trying to access login/signup, redirect to home
            return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
    }

    if (!session) {
        // Redirect to login if no session
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        await decrypt(session);
        return NextResponse.next();
    } catch (err) {
        // Invalid session
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
