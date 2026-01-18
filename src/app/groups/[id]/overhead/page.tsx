"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calculator, Info, Wallet, User, IndianRupee } from "lucide-react";

interface Group {
    id: number;
    name: string;
    overhead_balance: number;
}

export default function UseOverhead() {
    const { id } = useParams();
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchGroup = useCallback(async () => {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (Array.isArray(data)) {
            const found = data.find((g: Group) => g.id === Number(id));
            if (found) setGroup(found);
        }
    }, [id]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;
        if (group && Number(amount) > group.overhead_balance) {
            alert("자투리돈 잔액이 부족합니다!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "use_overhead",
                    groupId: Number(id),
                    amount: Number(amount),
                    note: note || "자투리돈 사용",
                }),
            });

            if (res.ok) {
                router.push(`/groups/${id}`);
            } else {
                const data = await res.json();
                alert(data.error || "처리 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Failed to use overhead:", error);
            alert("서버 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!group) return <div className="p-8 text-center text-slate-400 font-bold">정보를 불러오고 있어요... 🥣</div>;

    return (
        <div className="flex flex-col min-h-screen bg-amber-50/10">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-amber-50">
                <div className="px-6 py-5 flex items-center gap-4">
                    <Link href={`/groups/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-amber-500 transition-colors bg-slate-50 rounded-full">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">자투리돈 사용</h2>
                </div>
            </div>

            <div className="px-6 py-10 space-y-10">
                {/* Balance Display */}
                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl shadow-amber-200 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">💰</div>
                    <div className="flex items-center gap-2 text-white/80 mb-3 font-bold uppercase tracking-widest text-xs relative z-10 px-1">
                        <span className="bg-white/20 p-1.5 rounded-full"><IndianRupee size={14} strokeWidth={3} /></span>
                        사용 가능한 자투리돈
                    </div>
                    <div className="text-6xl font-bold tracking-tight relative z-10">
                        ₩{group.overhead_balance.toLocaleString()}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 px-2 uppercase tracking-widest flex items-center gap-2">
                            <Calculator size={14} strokeWidth={3} /> 사용할 금액
                        </label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-lg">₩</span>
                            <input
                                required
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-12 pr-6 py-5 rounded-[1.5rem] bg-white border-2 border-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-bold text-xl shadow-sm placeholder:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 px-2 uppercase tracking-widest">사용 메모 (선택)</label>
                        <textarea
                            placeholder="예: 밥총무가 쏜다!, 잔액 털기 할인..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-6 py-5 rounded-[1.5rem] bg-white border-2 border-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-bold text-lg h-40 shadow-sm placeholder:text-slate-200"
                        />
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-blue-50/50 border-2 border-blue-50 flex gap-5 shadow-inner">
                        <div className="bg-blue-500 p-3 rounded-2xl h-fit shadow-lg shadow-blue-200">
                            <Info className="text-white" size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 mb-1 leading-none">알아두세요!</h4>
                            <p className="text-sm text-blue-800 leading-relaxed font-semibold">
                                입력하신 금액만큼 모임의 공통 자금인 '자투리돈'에서 차감됩니다. 모임 전체를 위한 공동 경비나 이벤트에 사용해 보세요! 🎁
                            </p>
                        </div>
                    </div>

                    <button
                        disabled={isSubmitting || !amount}
                        type="submit"
                        className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-bold text-xl hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-95 mt-4"
                    >
                        {isSubmitting ? "처리 중..." : "잔액 사용하기!"}
                    </button>
                </form>
            </div>
        </div>
    );
}
