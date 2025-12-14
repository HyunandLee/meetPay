"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browserClient";
import { useRouter } from "next/navigation";
import BackToDashboard from "@/components/BackToDashboard";

type StudentProfile = {
  id?: string;
  name: string;
  university: string;
  faculty: string;
  grade: string;
  skills: string;
  about: string;
  wallet_address: string;
  icon_url: string;
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<StudentProfile>({
    name: "",
    university: "",
    faculty: "",
    grade: "",
    skills: "",
    about: "",
    wallet_address: "",
    icon_url: "",
  });

  // 入力ハンドラー
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 既存プロフィール読み込み
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm({
          name: data.name ?? "",
          university: data.university ?? "",
          faculty: data.faculty ?? "",
          grade: data.grade ?? "",
          skills: data.skills ?? "",
          about: data.about ?? "",
          wallet_address: data.wallet_address ?? "",
          icon_url: data.icon_url ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");

    const payload = {
      ...form,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("student_profiles")
      .upsert(payload);

    if (error) {
      alert(error.message);
    } else {
      alert("保存しました！");
      router.push("/student/dashboard");
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-2xl mx-auto">

        <BackToDashboard />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎓 学生プロフィール編集
        </h1>

        {/* カード全体 */}
        <div className="bg-white p-6 shadow-xl rounded-xl space-y-6">

          <FormInput label="🧑‍🎓 名前" name="name" value={form.name} onChange={handleChange} />
          <FormInput label="🏫 大学" name="university" value={form.university} onChange={handleChange} />
          <FormInput label="📘 学部・学科" name="faculty" value={form.faculty} onChange={handleChange} />

          <FormInput label="🎒 学年" name="grade" value={form.grade} onChange={handleChange} placeholder="1, 2, 3, 4 ..." />

          {/* Skills Tag風 */}
          <FormInput label="💡 スキル（カンマ区切り）" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Python, Web3..." />

          {/* About */}
          <div>
            <label className="font-semibold block mb-2">📝 自己紹介（ガクチカ）</label>
            <textarea
              name="about"
              value={form.about}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border rounded-xl bg-gray-50"
              placeholder="自己紹介やガクチカを書いてください"
            />
          </div>

          <FormInput
            label="💳 ウォレットアドレス"
            name="wallet_address"
            value={form.wallet_address}
            onChange={handleChange}
            placeholder="0x1234..."
          />

          <FormInput
            label="🖼 アイコンURL（任意）"
            name="icon_url"
            value={form.icon_url}
            onChange={handleChange}
            placeholder="https://..."
          />

          {/* Save */}
          <button
            onClick={save}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
          >
            保存する
          </button>
        </div>
      </div>
    </main>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="font-semibold block mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 border rounded-xl bg-gray-50"
      />
    </div>
  );
}
