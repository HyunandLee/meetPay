"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";

type Student = {
  id: string;
  name: string;
  university: string | null;
  faculty: string | null;
  grade: string | null;
  skills: string | null;
  wallet_address: `0x${string}` | null;
};

export default function StudentSearchPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setStudents(data as Student[]);
    }

    load();
  }, []);

  // 🔎 検索フィルタ
  const filtered = students.filter((s) => {
    const text =
      `${s.name} ${s.university} ${s.faculty} ${s.skills}`
        .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        <BackToDashboard />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🔍 学生を探す
        </h1>

        {/* 検索バー */}
        <input
          type="text"
          className="w-full p-3 mb-6 border rounded-xl bg-white shadow"
          placeholder="名前・大学・スキルで検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* 学生一覧 */}
        <div className="space-y-4">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}

          {filtered.length === 0 && (
            <p className="text-gray-500 text-center mt-10">該当する学生がいません。</p>
          )}
        </div>
      </div>
    </main>
  );
}

function StudentCard({ student }: { student: Student }) {
  return (
    <div className="bg-white p-6 shadow rounded-xl">
      <h2 className="text-xl font-bold">{student.name}</h2>

      <p className="text-gray-600 mt-1">
        🎓 {student.university ?? "大学不明"} / {student.faculty ?? "学部不明"}
      </p>

      <p className="mt-2 text-gray-700">
        🛠️ スキル：{student.skills ?? "未登録"}
      </p>

      {/* オファー */}
      {student.wallet_address && (
        <Link
          href={`/company/offer-send?to=${student.wallet_address}`}
          className="inline-block mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          🎁 オファーを送る
        </Link>
      )}
    </div>
  );
}
