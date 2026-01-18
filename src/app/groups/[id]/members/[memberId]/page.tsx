"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Wallet, History, Utensils, Coins, CalendarDays, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface Member {
    id: number;
    name: string;
    balance: number;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    note: string;
    restaurant_name?: string;
    created_at: string;
}

export default function MemberDetail() {
    const { id, memberId } = useParams();
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isRecharging, setIsRecharging] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        const [memberRes, transRes] = await Promise.all([
            fetch(`/api/members?groupId=${id}`),
            fetch(`/api/transactions?memberId=${memberId}`)
        ]);

        const membersData = await memberRes.json();
        const transData = await transRes.json();

        if (Array.isArray(membersData)) {
            const found = membersData.find((m: Member) => m.id === Number(memberId));
            if (found) setMember(found);
        }
        if (Array.isArray(transData)) setTransactions(transData);
    }, [id, memberId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function handleRecharge(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting || !rechargeAmount || parseInt(rechargeAmount) <= 0) return;

        setIsSubmitting(true);
        const res = await fetch("/api/transactions", {
            method: "POST",
            body: JSON.stringify({
                type: "deposit",
                memberId: Number(memberId),
                amount: parseInt(rechargeAmount),
                note: "금액 충전",
            }),
        });

        if (res.ok) {
            setRechargeAmount("");
            setIsRecharging(false);
            setIsSubmitting(false);
            fetchData();
        } else {
            setIsSubmitting(false);
            alert("충전에 실패했어요 😢");
        }
    }

    if (!member) return <div className="p-8 text-center text-slate-400 font-bold">정보를 불러오고 있어요... 🥣</div>;

    return (
        <div className="flex flex-col min-h-screen bg-emerald-50/10">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-10 pb-16 text-white rounded-b-[3rem] shadow-xl shadow-emerald-100">
                <Link href={`/groups/${id}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 font-bold text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    <ChevronLeft size={18} strokeWidth={3} />
                    <span>모임 상세로 돌아가기</span>
                </Link>
                <div className="flex items-center gap-4 mb-6 px-1">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white text-emerald-600 flex items-center justify-center font-bold text-3xl shadow-lg">
                        {member.name[0]}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold leading-tight">{member.name} 멤버</h2>
                        <p className="text-emerald-100 font-bold opacity-80">맛있는 식사를 함께해요! ✨</p>
                    </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-inner flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-xs mb-1 uppercase tracking-widest font-bold">나의 현재 잔액</p>
                        <p className="text-4xl font-bold">₩{member.balance?.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => setIsRecharging(true)}
                        className="bg-white text-emerald-600 p-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={4} />
                    </button>
                </div>
            </div>

            <div className="px-6 -mt-8 space-y-8">
                {/* Recharge Form (Conditional) */}
                {isRecharging && (
                    <div className="p-6 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center gap-2">
                            <Coins className="text-emerald-500" size={20} strokeWidth={3} />
                            잔액 충전하기
                        </h3>
                        <form onSubmit={handleRecharge} className="flex flex-col gap-3">
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-lg">₩</span>
                                <input
                                    autoFocus
                                    type="number"
                                    placeholder="충전할 금액 입력"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                    className="w-full pl-11 pr-5 py-4 rounded-2xl bg-emerald-50/30 border-2 border-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-bold text-lg"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !rechargeAmount}
                                    className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                                >
                                    {isSubmitting ? "처리 중..." : "충전 완료"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRecharging(false)}
                                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Transaction History */}
                <div className="space-y-5 pb-10">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                        <History size={22} className="text-emerald-500" strokeWidth={3} />
                        이용 내역
                    </h3>

                    <div className="space-y-4">
                        {transactions.map((t) => (
                            <div key={t.id} className="bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center gap-4 group">
                                <div className={`p-3 rounded-2xl shadow-sm transition-colors ${t.type === 'deposit' || t.type === 'overhead_usage'
                                    ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                                    : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
                                    }`}>
                                    {t.type === 'deposit' || t.type === 'overhead_usage'
                                        ? <ArrowUpCircle size={24} strokeWidth={2.5} />
                                        : <ArrowDownCircle size={24} strokeWidth={2.5} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="font-bold text-slate-700">
                                            {t.type === 'meal' ? (t.restaurant_name || "식사 이용") : (t.note || "충전/사용")}
                                        </h4>
                                        <span className={`font-bold text-lg ${t.type === 'deposit' || t.type === 'overhead_usage' ? 'text-blue-500' : 'text-rose-500'
                                            }`}>
                                            {t.type === 'deposit' || t.type === 'overhead_usage' ? '+' : '-'}₩{Math.abs(t.amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <CalendarDays size={12} strokeWidth={3} />
                                        {new Date(t.created_at).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {transactions.length === 0 && (
                            <div className="py-20 text-center text-slate-300 flex flex-col items-center gap-4">
                                <div className="text-5xl grayscale opacity-20">📜</div>
                                <p className="font-bold">아직 내역이 없어요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
