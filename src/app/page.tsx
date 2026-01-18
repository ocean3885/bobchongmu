"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight, LayoutDashboard } from "lucide-react";

interface Group {
  id: number;
  name: string;
  overhead_balance: number;
  created_at: string;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function fetchGroups() {
    const res = await fetch("/api/groups");
    const data = await res.json();
    if (Array.isArray(data)) setGroups(data);
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await fetch("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: newGroupName }),
    });

    if (res.ok) {
      setNewGroupName("");
      setIsCreating(false);
      fetchGroups();
    }
  }

  return (
    <div className="px-6 py-10 space-y-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">모임 관리</h2>
        <p className="text-slate-500 font-medium leading-relaxed">내 모임을 선택하거나 새로운 모임을 만들어보세요! 😊</p>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="flex items-center justify-between p-6 rounded-[2rem] bg-orange-50/50 border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-100/30 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-orange-200 text-orange-600 rounded-[1.25rem] group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{group.name}</h3>
                <p className="text-sm font-semibold text-orange-400 mt-1">자투리돈: ₩{group.overhead_balance?.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-2 rounded-full shadow-sm text-orange-300 group-hover:text-orange-500 transition-colors">
              <ChevronRight size={20} strokeWidth={3} />
            </div>
          </Link>
        ))}

        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-[2rem] border-2 border-dashed border-orange-200 text-orange-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 group"
          >
            <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
              <Plus size={28} strokeWidth={3} />
            </div>
            <span className="font-bold text-lg">새로운 모임 만들기</span>
          </button>
        ) : (
          <form onSubmit={createGroup} className="p-6 rounded-[2rem] bg-white border-2 border-orange-200 shadow-xl shadow-orange-100/50 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-slate-700 px-1">모임 이름을 알려주세요!</h3>
            <input
              autoFocus
              type="text"
              placeholder="예: 밥도둑들, 회식 매니아..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-orange-50/50 border-2 border-orange-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-lg placeholder:text-orange-200"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-200"
              >
                만들기
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>

      {groups.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-6xl mb-2 grayscale opacity-30">🥣</div>
          <p className="font-bold text-slate-400 text-lg leading-relaxed">
            아직 활성화된 모임이 없어요.<br />첫 번째 모임을 만들어보세요!
          </p>
        </div>
      )}
    </div>
  );
}
