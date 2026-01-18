"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, ChevronRight, Hash, LogOut, ChevronLeft, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
    id: number;
    name: string;
    member_count: number;
    total_balance: number;
    created_at: string;
    dissolved_at: string | null;
}

export default function ProfilePage() {
    const [user, setUser] = useState<{ username: string; nickname?: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editNickname, setEditNickname] = useState("");
    const [pastGroups, setPastGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    };

    useEffect(() => {
        async function fetchProfileData() {
            try {
                // Fetch User
                const authRes = await fetch("/api/auth/me");
                const authData = await authRes.json();
                if (authData.user) {
                    setUser(authData.user);
                    setEditNickname(authData.user.nickname || "");
                } else {
                    router.push("/login"); // Redirect if not logged in
                    return;
                }

                // Fetch Inactive Groups
                const groupsRes = await fetch("/api/groups?active=false");
                const groupsData = await groupsRes.json();
                if (Array.isArray(groupsData)) {
                    setPastGroups(groupsData);
                }
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfileData();
    }, [router]);

    async function handleUpdateProfile() {
        if (!user) return;

        try {
            const res = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: editNickname }),
            });

            if (res.ok) {
                const data = await res.json();
                setUser({ ...user, nickname: data.nickname });
                setIsEditing(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to update profile", error);
        }
    }

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold">로딩 중... 👤</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            {/* Header / Profile Bg */}
            <div className="bg-slate-900 pt-12 pb-24 px-6 rounded-b-[3rem] relative shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-bold bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                    <ChevronLeft size={16} strokeWidth={3} /> 홈으로
                </Link>

                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-orange-400 to-rose-500 p-1 shadow-2xl shadow-orange-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white">
                            <User size={40} strokeWidth={1.5} />
                        </div>
                    </div>
                    <div>
                        <div>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editNickname}
                                        onChange={(e) => setEditNickname(e.target.value)}
                                        className="bg-white/10 text-white text-3xl font-black px-4 py-1 rounded-xl outline-none border-2 border-orange-500/50 focus:border-orange-500 w-48 text-center placeholder-slate-400"
                                        placeholder="별명 입력"
                                        autoFocus
                                    />
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                                        >
                                            <Check size={16} strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="bg-slate-700 text-white p-1.5 rounded-lg hover:bg-slate-600 transition-colors shadow-lg"
                                        >
                                            <X size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3 group cursor-pointer" onClick={() => {
                                    setEditNickname(user?.nickname || "");
                                    setIsEditing(true);
                                }}>
                                    <h2 className="text-3xl font-black text-white tracking-tight">{user?.nickname || user?.username}님</h2>
                                    <div className="bg-white/10 p-2 rounded-full text-slate-400 group-hover:text-white group-hover:bg-orange-500 transition-all">
                                        <Edit2 size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            )}
                            <p className="text-slate-500 font-medium text-sm mt-2">{user?.username} | 밥총무와 함께한 맛있는 추억들</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 -mt-10 relative z-20 space-y-8">
                {/* Past Groups Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[200px]">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Hash size={24} className="text-slate-300" />
                        지난 밥조
                    </h3>

                    <div className="space-y-4">
                        {pastGroups.length > 0 ? (
                            pastGroups.map((group) => (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}/history`}
                                    className="block p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-700 text-lg">{group.name}</h4>
                                            <div className="text-slate-300 group-hover:text-orange-400 transition-colors">
                                                <ChevronRight size={20} strokeWidth={3} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                                {formatDate(group.created_at)} - {group.dissolved_at ? formatDate(group.dissolved_at) : '진행 중'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 px-1">
                                                참여 멤버 {group.member_count}명
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 font-bold text-sm bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                해산된 밥조가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 text-slate-400 font-bold text-sm bg-white rounded-2xl border border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut size={16} /> 로그아웃
                </button>
            </div>
        </div>
    );
}
