"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Utensils, History, Calendar, Coins, Users } from "lucide-react";

interface Meal {
    id: number;
    restaurant_name: string;
    date: string;
    total_amount: number;
    amount_per_person: number;
    participant_names: string;
}

export default function MealHistory() {
    const { id } = useParams();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMeals = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/meals?groupId=${id}&limit=1000`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMeals(data);
            }
        } catch (error) {
            console.error("Failed to fetch meals:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMeals();
    }, [fetchMeals]);


    return (
        <div className="flex flex-col min-h-screen bg-orange-50/10 pb-20">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-orange-50">
                <div className="px-6 py-5 flex items-center gap-4">
                    <Link href={`/groups/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors bg-slate-50 rounded-full">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">전체 식사 내역</h2>
                </div>
            </div>

            <div className="px-6 py-8 space-y-10">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        식사 내역을 불러오는 중...
                    </div>
                ) : meals.length > 0 ? (
                    <>
                        {/* Meal List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <History size={14} /> 전체 기록 ({meals.length}건)
                            </h3>
                            <div className="space-y-4">
                                {meals.map((meal) => (
                                    <div
                                        key={meal.id}
                                        className="p-6 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-xl hover:shadow-orange-200/5 transition-all space-y-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                                    <Utensils size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 leading-tight truncate text-lg">{meal.restaurant_name}</h4>
                                                    <span className="text-xs font-bold text-slate-400 mt-0.5 block">{meal.date}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter block leading-none mb-1">총 결제</span>
                                                <span className="text-xl font-bold text-orange-500">₩{meal.total_amount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mb-1.5 flex items-center gap-1">
                                                    <Users size={10} /> 함께한 멤버
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {meal.participant_names.split(',').map((name, i) => (
                                                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-full border border-slate-100 italic">
                                                            {name.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg shadow-slate-200">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block leading-none mb-0.5">1인당</span>
                                                <span className="text-sm font-bold">₩{meal.amount_per_person.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-20 text-center text-slate-300 flex flex-col items-center gap-4">
                        <div className="p-8 bg-white rounded-full shadow-inner">
                            <History size={48} strokeWidth={1} className="opacity-20" />
                        </div>
                        <p className="font-bold">아직 기록된 식사가 없어요.</p>
                        <Link href={`/groups/${id}/add-meal`} className="mt-2 px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all">
                            첫 식사 기록하기
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
