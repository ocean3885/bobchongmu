"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Settings, Info, Save, Calendar } from "lucide-react";

interface Group {
    id: number;
    name: string;
    created_at: string;
}

export default function GroupSettings() {
    const { id } = useParams();
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGroup = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/groups?id=${id}`);
            const data = await res.json();
            if (data && !data.error) {
                setGroup(data);
                setName(data.name);
            }
        } catch (error) {
            console.error("Failed to fetch group:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    async function handleSave() {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/groups", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: Number(id), name }),
            });

            if (res.ok) {
                alert("모임 설정이 저장되었습니다!");
                router.push(`/groups/${id}`);
            }
        } catch (error) {
            console.error("Failed to update group:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-400 font-bold">정보를 불러오고 있어요... 🥣</div>;
    if (!group) return <div className="p-8 text-center text-slate-400 font-bold">모임을 찾을 수 없습니다.</div>;

    const creationDate = new Date(group.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 pb-20">
            <div className="bg-white border-b border-slate-100">
                <div className="px-6 py-5 flex items-center gap-4">
                    <Link href={`/groups/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">모임 설정</h2>
                </div>
            </div>

            <div className="px-6 py-8 space-y-8 max-w-md mx-auto w-full">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2">
                        <Settings size={20} strokeWidth={2.5} />
                        <h3 className="font-bold text-lg">기본 정보 수정</h3>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">모임 이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="모임 이름을 입력하세요"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-400 focus:bg-white transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {isSaving ? "저장 중..." : "설정 저장하기"}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shrink-0">
                        <Info size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">모임 정보</h3>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-xs font-bold whitespace-nowrap">모임 생성일: {creationDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
