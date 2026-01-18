"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, ChevronRight, LayoutDashboard } from "lucide-react";

interface Group {
  id: number;
  name: string;
  member_count: number;
  total_balance: number;
  created_at: string;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: newGroupName }),
      });

      if (res.ok) {
        setNewGroupName("");
        setIsCreating(false);
        fetchGroups();
      } else {
        const errorData = await res.json();
        alert(`모임 생성 실패: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Group creation error:", err);
      alert("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      {/* Hero Section - Compact for Mobile */}
      <section className="relative overflow-hidden bg-white px-6 py-8 sm:py-16 border-b border-slate-100">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[300px] h-[300px] bg-orange-100/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[80px]" />

        <div className="relative max-w-2xl mx-auto text-center space-y-3 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold tracking-wider uppercase">
            Smart Lunch Manager
          </div>
          <h1 className="text-2xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            오늘 점심 누가 왔지?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              계산은 밥총무가 할게요.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-500 font-medium leading-relaxed max-w-xl mx-auto px-4">
            먹은 사람만 콕 집어 차감하는 똑똑한 장부 관리. <br className="hidden sm:block" />
            이제 정산 대신 커피 한 잔의 여유를 즐기세요. ☕
          </p>
        </div>
      </section>

      <div className="w-full px-4 sm:px-8 py-6 sm:py-12 space-y-6 sm:space-y-10">

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center justify-between p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border border-slate-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-100/50 transition-colors" />

              <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 text-slate-400 rounded-2xl sm:rounded-3xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Users size={20} className="sm:w-7 sm:h-7" strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-0.5 sm:gap-2">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">{group.name}</h3>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm sm:text-lg font-extrabold text-orange-500">
                      잔액: {group.total_balance?.toLocaleString() || 0}원
                    </span>
                    <span className="text-[10px] sm:text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-300" />
                      인원: {group.member_count}명
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all duration-300">
                <ChevronRight size={16} className="sm:w-5 sm:h-5" strokeWidth={3} />
              </div>
            </Link>
          ))}

          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="group flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-orange-500 shadow-sm transition-all">
                <Plus size={24} className="sm:w-8 sm:h-8" strokeWidth={3} />
              </div>
              <span className="font-bold text-base sm:text-lg">새로운 모임 만들기</span>
            </button>
          ) : (
            <form onSubmit={createGroup} className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border-2 border-orange-200 shadow-2xl shadow-orange-200/20 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 px-1">모임 이름</h3>
                <p className="text-xs sm:text-sm text-slate-400 px-1">멋진 이름을 지어주세요!</p>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="예: 밥도둑들, 회식 매니아..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base sm:text-lg"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-500 active:scale-95 transition-all shadow-lg hover:shadow-orange-500/20"
                >
                  생성하기
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm sm:text-base"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        {groups.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center space-y-4 sm:space-y-6 bg-white/50 rounded-[2rem] sm:rounded-[3rem] border border-dashed border-slate-200">
            <div className="text-4xl sm:text-6xl animate-bounce">🥣</div>
            <div className="space-y-1 sm:space-y-2">
              <p className="font-black text-slate-400 text-lg sm:text-2xl tracking-tight">아직 모임이 없네요</p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">첫 번째 밥조를 만들고 정산을 시작해보세요!</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section - Distinct Dark Mode */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <span className="font-black text-white tracking-tight text-lg">밥총무</span>
          </div>
          <p className="text-sm text-slate-400 font-medium text-center max-w-xs leading-relaxed">
            복잡한 정산은 밥총무에게 맡기고<br />
            즐거운 식사 시간을 더 소중하게 보내세요.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all cursor-pointer">
              <span className="text-xs font-bold">IG</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all cursor-pointer">
              <span className="text-xs font-bold">X</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            © 2026 Bobchongmu. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
