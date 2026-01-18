"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowRight, Lock, User } from "lucide-react";

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!username || !password) return;
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                setError(data.error || "회원가입에 실패했습니다.");
            }
        } catch (err) {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 -mt-4">
            <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-[3rem] shadow-2xl shadow-orange-100 border border-orange-50 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-block p-4 bg-orange-100 text-orange-500 rounded-[1.5rem] mb-1">
                        <UserPlus size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">반가워요! ✨</h2>
                    <p className="text-xs font-medium text-slate-400 px-4">밥총무와 함께 똑똑한 정산을 시작해볼까요?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="relative group">
                            <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="아이디"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-400 focus:bg-white transition-all outline-none font-semibold text-slate-700 placeholder:text-slate-300 text-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-400 transition-colors" />
                            <input
                                type="password"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-400 focus:bg-white transition-all outline-none font-semibold text-slate-700 placeholder:text-slate-300 text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 text-center animate-in fade-in zoom-in-95 duration-200">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-2 group transition-all active:scale-95"
                    >
                        {isLoading ? "가입 중..." : "가입하기"}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-xs font-semibold text-slate-400">
                        이미 계정이 있나요?{" "}
                        <Link href="/login" className="text-orange-500 hover:underline">로그인하기 ➔</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
