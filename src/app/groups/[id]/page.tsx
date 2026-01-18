"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Users, Utensils, IndianRupee, History, Settings, ChevronLeft, Wallet, Coins } from "lucide-react";

interface Group {
    id: number;
    name: string;
    overhead_balance: number;
}

interface Member {
    id: number;
    name: string;
    balance: number;
    is_active: number;
}

interface Meal {
    id: number;
    restaurant_name: string;
    date: string;
    total_amount: number;
    amount_per_person: number;
}

export default function GroupDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);

    const fetchData = useCallback(async () => {
        const [groupRes, memberRes, mealRes] = await Promise.all([
            fetch("/api/groups"),
            fetch(`/api/members?groupId=${id}`),
            fetch(`/api/meals?groupId=${id}&limit=5`)
        ]);

        const groupData = await groupRes.json();
        const memberData = await memberRes.json();
        const mealData = await mealRes.json();

        if (Array.isArray(groupData)) {
            const found = groupData.find((g: Group) => g.id === Number(id));
            if (found) setGroup(found);
        }
        if (Array.isArray(memberData)) setMembers(memberData);
        if (Array.isArray(mealData)) setMeals(mealData);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!group) return <div className="p-8 text-center text-slate-400 font-bold">정보를 불러오고 있어요... 🥣</div>;

    const activeMembers = members.filter(m => m.is_active === 1);
    const totalMembersBalance = activeMembers.reduce((sum, m) => sum + m.balance, 0);
    const totalBalance = totalMembersBalance + (group.overhead_balance || 0);

    return (
        <div className="flex flex-col min-h-screen bg-orange-50/20">
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 px-6 pt-10 pb-16 text-white rounded-b-[3rem] shadow-xl shadow-orange-100">
                <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 font-bold text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    <ChevronLeft size={18} strokeWidth={3} />
                    <span>모든 모임 보기</span>
                </Link>
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">🏠</span>
                    <h2 className="text-3xl font-bold">{group.name}</h2>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 shadow-inner relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">💰</div>
                    <div className="relative z-10">
                        <p className="text-white/80 text-xs mb-1 uppercase tracking-widest font-bold flex items-center gap-1">
                            <Wallet size={12} /> 우리 모임 총합 잔액
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold tracking-tight">{totalBalance.toLocaleString()}원</span>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Coins size={14} className="text-amber-200" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-0.5">자투리돈</p>
                                    <p className="text-base font-bold">{group.overhead_balance?.toLocaleString()}원</p>
                                </div>
                            </div>
                            <Link href={`/groups/${id}/overhead`} className="bg-white/20 hover:bg-white/30 text-xs px-3 py-2 rounded-xl font-bold transition-all transition-colors active:scale-95">
                                사용하기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-10 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => {
                            if (activeMembers.length === 0) {
                                alert("멤버를 먼저 추가하시기 바랍니다");
                            } else {
                                router.push(`/groups/${id}/add-meal`);
                            }
                        }}
                        className="w-full flex items-center gap-5 p-6 rounded-[2.5rem] bg-white shadow-xl shadow-orange-200/20 border-2 border-transparent hover:border-orange-200 transition-all duration-300 group overflow-hidden relative text-left"
                    >
                        <div className="p-4 bg-orange-100 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                            <Utensils size={28} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 z-10">
                            <h3 className="text-xl font-bold text-slate-800">식사 기록하기</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-0.5">비용 정산을 시작해보세요!</p>
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href={`/groups/${id}/members`}
                            className="flex flex-col gap-3 p-6 rounded-[2.5rem] bg-white shadow-xl shadow-emerald-200/20 border-2 border-transparent hover:border-emerald-200 transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="p-3 bg-emerald-100 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 w-fit">
                                <Users size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">멤버 관리</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">멤버 추가/수정</p>
                            </div>
                        </Link>

                        <div className="flex flex-col gap-4">
                            <Link
                                href={`/groups/${id}/settings`}
                                className="flex-1 flex flex-col gap-3 p-6 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 text-slate-400 text-sm font-bold items-center justify-center hover:bg-white hover:border-orange-100 transition-all active:scale-95 group"
                            >
                                <Settings size={20} className="group-hover:rotate-45 transition-transform" />
                                모임 설정
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Member List Section */}
                <div className="pt-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                        <Users size={20} className="text-emerald-500" strokeWidth={3} />
                        멤버 현황
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg ml-1">
                            {members.filter(m => m.is_active === 1).length}명
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {members.filter(m => m.is_active === 1).map((member) => (
                            <Link
                                key={member.id}
                                href={`/groups/${id}/members/${member.id}`}
                                className="flex items-center justify-between p-5 rounded-[2rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-xl hover:shadow-emerald-200/20 hover:border-emerald-200 transition-all group overflow-hidden relative"
                            >
                                <div className="flex items-center gap-4 relative z-10 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shrink-0">
                                        {member.name[0]}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-700 text-lg leading-tight truncate">{member.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">상세 내역 보기 ➔</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end relative z-10 shrink-0">
                                    <span className="text-[10px] font-bold text-slate-300 mb-0.5 px-1 uppercase tracking-tighter">현재 잔액</span>
                                    <div className={member.balance < 0
                                        ? "text-rose-500 font-bold text-base bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100"
                                        : "text-emerald-600 font-bold text-base bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100"}>
                                        {member.balance.toLocaleString()}원
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-2 text-6xl opacity-[0.02] group-hover:scale-110 transition-transform duration-500 grayscale pointer-events-none">👤</div>
                            </Link>
                        ))}
                        {members.length === 0 && (
                            <div className="bg-white/50 border-2 border-dashed border-slate-100 rounded-[2rem] p-8 text-center text-slate-400 font-bold text-sm">
                                아직 등록된 멤버가 없어요.<br />
                                <Link href={`/groups/${id}/members`} className="text-emerald-500 underline mt-1 inline-block text-xs">멤버를 추가해 보세요!</Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="py-8 pb-12">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <History size={20} strokeWidth={3} className="text-orange-400" />
                            최근 식사 기록
                        </h3>
                        <Link
                            href={`/groups/${id}/meals`}
                            className="text-xs font-bold text-orange-500 px-4 py-2 rounded-full bg-orange-50 hover:bg-orange-100 transition-all active:scale-95"
                        >
                            전체 보기 ➔
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {meals.map((meal) => (
                            <div
                                key={meal.id}
                                className="p-5 rounded-[2rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-xl hover:shadow-orange-200/10 hover:border-orange-100 transition-all flex items-center justify-between group gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                                        <Utensils size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-800 leading-tight truncate">{meal.restaurant_name}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{meal.date}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end shrink-0">
                                    <div className="flex flex-col items-end mb-1">
                                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter leading-none">총 결제</span>
                                        <span className="text-lg font-bold text-orange-500 leading-tight">{meal.total_amount.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter leading-none">1인당</span>
                                        <span className="text-sm font-semibold text-slate-500 leading-none">{meal.amount_per_person.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {meals.length === 0 && (
                            <div className="p-10 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-100 text-center text-slate-300 font-bold text-sm flex flex-col items-center gap-3">
                                <Utensils size={32} strokeWidth={1.5} className="opacity-20" />
                                아직 기록된 식사가 없어요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
