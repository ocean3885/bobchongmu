"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Utensils, Coins, Check, Users, ChevronLeft } from "lucide-react";

interface Member {
    id: number;
    name: string;
    is_active: number;
}

export default function AddMeal() {
    const { id } = useParams();
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [restaurantName, setRestaurantName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalAmount, setTotalAmount] = useState<string>("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatNumber = (val: string) => {
        const num = val.replace(/[^0-9]/g, "");
        return num ? Number(num).toLocaleString() : "";
    };

    const fetchMembers = useCallback(async () => {
        const res = await fetch(`/api/members?groupId=${id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            // Only use active members for meal recording
            setMembers(data.filter((m: Member) => m.is_active === 1));
        }
    }, [id]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const toggleMember = (memberId: number) => {
        setSelectedMemberIds(prev =>
            prev.includes(memberId)
                ? prev.filter(mid => mid !== memberId)
                : [...prev, memberId]
        );
    };

    const selectAll = () => {
        if (selectedMemberIds.length === members.length) {
            setSelectedMemberIds([]);
        } else {
            setSelectedMemberIds(members.map(m => m.id));
        }
    };

    const calculation = useMemo(() => {
        const amount = parseInt(totalAmount.replace(/,/g, "")) || 0;
        const count = selectedMemberIds.length;
        if (amount <= 0 || count <= 0) return { perPerson: 0, overhead: 0 };

        const rawPerPerson = amount / count;
        const perPerson = Math.ceil(rawPerPerson / 100) * 100;
        const overhead = (perPerson * count) - amount;

        return { perPerson, overhead };
    }, [totalAmount, selectedMemberIds]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const numericAmount = parseInt(totalAmount.replace(/,/g, ""));
        if (isSubmitting || !restaurantName || !numericAmount || selectedMemberIds.length === 0) return;

        setIsSubmitting(true);
        const res = await fetch("/api/meals", {
            method: "POST",
            body: JSON.stringify({
                groupId: Number(id),
                restaurantName,
                date,
                totalAmount: numericAmount,
                amountPerPerson: calculation.perPerson,
                participantIds: selectedMemberIds,
            }),
        });

        if (res.ok) {
            router.push(`/groups/${id}`);
        } else {
            setIsSubmitting(false);
            alert("기록 저장에 실패했어요 😢");
        }
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-orange-50/10">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-orange-50">
                <div className="px-6 py-5 flex items-center gap-4">
                    <Link href={`/groups/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors bg-slate-50 rounded-full">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">식사 기록</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-8 space-y-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 flex items-center gap-2 px-1 uppercase tracking-widest">
                            <Utensils size={14} strokeWidth={3} /> 식당 이름
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="어디서 드셨나요? (예: 맛나김밥)"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            className="w-full h-[72px] px-5 rounded-[1.5rem] bg-white border-2 border-slate-100 appearance-none focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-lg shadow-sm placeholder:text-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 flex items-center gap-2 px-1 uppercase tracking-widest">
                                <Calendar size={14} strokeWidth={3} /> 날짜
                            </label>
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-[72px] px-5 rounded-[1.5rem] bg-white border-2 border-slate-100 appearance-none focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-lg shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 flex items-center gap-2 px-1 uppercase tracking-widest">
                                <Coins size={14} strokeWidth={3} /> 총 결제 금액
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(formatNumber(e.target.value))}
                                    className="w-full h-[72px] px-5 rounded-[1.5rem] bg-white border-2 border-slate-100 appearance-none focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-lg shadow-sm placeholder:text-slate-300 pr-12"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">원</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                            <Users size={14} strokeWidth={3} /> 함께한 멤버 ({selectedMemberIds.length})
                        </label>
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs font-bold text-orange-500 px-4 py-2 rounded-full bg-orange-50 hover:bg-orange-100 transition-all active:scale-95"
                        >
                            {selectedMemberIds.length === members.length ? "전체 해제" : "전체 선택"}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {members.map((member) => (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleMember(member.id)}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${selectedMemberIds.includes(member.id)
                                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                                    : "bg-white border-slate-100 text-slate-500 hover:border-orange-100"
                                    }`}
                            >
                                <span className="font-bold truncate mr-2">{member.name}</span>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${selectedMemberIds.includes(member.id) ? "bg-white border-white text-orange-500" : "border-slate-200"
                                    }`}>
                                    {selectedMemberIds.includes(member.id) && <Check size={12} strokeWidth={4} />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calculation Preview */}
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Coins size={80} strokeWidth={1.5} />
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold tracking-widest uppercase relative z-10 transition-colors">
                        <span>1인당 부담 금액 (올림 처리)</span>
                        <span>자투리돈 적립</span>
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                        <div className="text-4xl font-bold tracking-tight">
                            {calculation.perPerson.toLocaleString()}원
                        </div>
                        <div className="text-emerald-400 font-bold text-lg mb-1 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                            +{calculation.overhead.toLocaleString()}원
                        </div>
                    </div>
                    <div className="pt-5 border-t border-white/10 relative z-10">
                        <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                            * 개인 잔액에서 올림된 금액만큼 차감되며, 발생하는 차액은 '자투리돈'으로 적립되어 나중에 멤버들을 위해 사용할 수 있어요! ✨
                        </p>
                    </div>
                </div>

                <button
                    disabled={isSubmitting || !restaurantName || !totalAmount || selectedMemberIds.length === 0}
                    type="submit"
                    className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-bold text-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-95"
                >
                    {isSubmitting ? "기록 중..." : "기록 완료!"}
                </button>
            </form >
        </div >
    );
}
