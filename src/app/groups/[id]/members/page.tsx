"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Wallet, Plus, ChevronLeft } from "lucide-react";

interface Member {
    id: number;
    name: string;
    balance: number;
    is_active: number;
}

export default function MemberManage() {
    const { id } = useParams();
    const [members, setMembers] = useState<Member[]>([]);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberBalance, setNewMemberBalance] = useState("");

    const fetchMembers = useCallback(async () => {
        const res = await fetch(`/api/members?groupId=${id}`);
        const data = await res.json();
        if (Array.isArray(data)) setMembers(data);
    }, [id]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    async function addMember(e: React.FormEvent) {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        const res = await fetch("/api/members", {
            method: "POST",
            body: JSON.stringify({
                groupId: Number(id),
                name: newMemberName,
                balance: newMemberBalance ? parseInt(newMemberBalance.replace(/,/g, '')) : 0
            }),
        });

        if (res.ok) {
            setNewMemberName("");
            setNewMemberBalance("");
            fetchMembers();
        }
    }

    async function toggleWithdrawal(memberId: number, currentStatus: number) {
        const confirmMsg = currentStatus === 1
            ? "정말 이 멤버를 탈퇴 처리하시겠습니까?\n현재 잔액이 정산금으로 표시됩니다."
            : "이 멤버를 다시 활성화하시겠습니까?";

        if (!confirm(confirmMsg)) return;

        const res = await fetch("/api/members", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId, isActive: currentStatus === 1 ? 0 : 1 }),
        });

        if (res.ok) {
            fetchMembers();
        }
    }

    const activeMembers = members.filter(m => m.is_active === 1);
    const inactiveMembers = members.filter(m => m.is_active === 0);

    return (
        <div className="flex flex-col min-h-screen pb-10 bg-emerald-50/10">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-emerald-50">
                <div className="px-6 py-5 flex items-center gap-4">
                    <Link href={`/groups/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-emerald-500 transition-colors bg-slate-50 rounded-full">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">멤버 관리</h2>
                </div>
            </div>

            <div className="px-6 py-8 space-y-8">
                {/* Add Member Form */}
                <div className="p-6 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-xl shadow-emerald-500/5 space-y-5">
                    <div className="flex items-center gap-2 text-emerald-600 px-1 pt-1">
                        <UserPlus size={22} strokeWidth={3} />
                        <h3 className="font-bold text-lg">새로운 멤버 추가</h3>
                    </div>
                    <form onSubmit={addMember} className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="멤버 이름"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-semibold text-lg placeholder:text-emerald-200"
                        />
                        <input
                            type="text"
                            placeholder="초기 예치금 (선택)"
                            value={newMemberBalance}
                            onChange={(e) => {
                                const value = e.target.value.replace(/,/g, '');
                                if (!isNaN(Number(value)) || value === '') {
                                    setNewMemberBalance(Number(value).toLocaleString());
                                }
                            }}
                            className="w-full px-5 py-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-semibold text-lg placeholder:text-emerald-200"
                        />
                        <button
                            type="submit"
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Plus size={20} strokeWidth={4} />
                            추가하기
                        </button>
                    </form>
                </div>

                {/* Member List Section */}
                <div className="space-y-5">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">
                            <span>현재 활동 중인 멤버 ({members.length})</span>
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {/* Active Members */}
                        <div className="space-y-3">
                            {activeMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-5 rounded-[2rem] bg-white border-2 border-transparent hover:border-emerald-100 shadow-xl shadow-slate-200/20 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-xl border-b-4 border-emerald-300">
                                            {member.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-lg leading-tight">{member.name}</span>
                                            <button
                                                onClick={() => toggleWithdrawal(member.id, 1)}
                                                className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors mt-0.5 w-fit"
                                            >
                                                탈퇴 처리하기 ➔
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-0.5 px-1">
                                            <Wallet size={12} strokeWidth={3} />
                                            나의 잔액
                                        </div>
                                        <div className={member.balance < 0
                                            ? "bg-rose-50 text-rose-500 px-4 py-1.5 rounded-full font-bold text-base border border-rose-100"
                                            : "bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full font-bold text-base border border-emerald-100"}>
                                            {member.balance.toLocaleString()}원
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Inactive Members Section */}
                        {inactiveMembers.length > 0 && (
                            <div className="pt-4 space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
                                    탈퇴한 멤버 ({inactiveMembers.length})
                                </h3>
                                <div className="space-y-3">
                                    {inactiveMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50/50 border-2 border-dashed border-slate-200 opacity-60 grayscale-[0.5] transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xl">
                                                    {member.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-500 text-lg leading-tight">{member.name}</span>
                                                    <button
                                                        onClick={() => toggleWithdrawal(member.id, 0)}
                                                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700 transition-colors mt-0.5 w-fit"
                                                    >
                                                        다시 활성화하기 ➔
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-0.5 px-1">
                                                    정산금
                                                </div>
                                                <div className="text-slate-500 font-bold text-base px-1">
                                                    {member.balance.toLocaleString()}원
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeMembers.length === 0 && inactiveMembers.length === 0 && (
                            <div className="py-20 text-center text-slate-300 flex flex-col items-center gap-4">
                                <div className="text-5xl grayscale opacity-20">🫥</div>
                                <p className="font-bold">멤버를 찾을 수 없어요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
