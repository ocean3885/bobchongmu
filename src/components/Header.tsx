"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function Header() {
    const [user, setUser] = useState<{ username: string; nickname?: string } | null>(null);
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
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 backdrop-blur-md z-30 shadow-lg shadow-slate-950/20">
            <Link href="/" className="hover:opacity-90 transition-opacity">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
                        <User size={18} strokeWidth={3} />
                    </div>
                    <span className="tracking-tight">밥총무</span>
                </h1>
            </Link>

            {!isAuthPage && user && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <Link href="/profile" className="flex flex-col items-end group cursor-pointer">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none group-hover:text-orange-500 transition-colors">MEMBER</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{user.nickname || user.username}님</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:scale-125 transition-transform" />
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all active:scale-95 border border-slate-700"
                        title="로그아웃"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </header>
    );
}
