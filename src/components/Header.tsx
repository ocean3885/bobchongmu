"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function Header() {
    const [user, setUser] = useState<{ username: string } | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Don't show header elements on auth pages
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                setUser(null);
            }
        }
        fetchUser();
    }, [pathname]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="px-6 py-5 border-b border-orange-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
            <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                    <span className="bg-orange-100 p-2 rounded-2xl text-xl transition-transform active:scale-90">🍚</span>
                    <span className="tracking-tighter">밥총무</span>
                </h1>
            </Link>

            {!isAuthPage && user && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">반가워요</span>
                        <span className="text-xs font-bold text-slate-600">{user.username}님</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-rose-100"
                        title="로그아웃"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </header>
    );
}
