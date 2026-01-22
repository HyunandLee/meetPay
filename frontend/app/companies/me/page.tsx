"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

type CompanyProfile = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  description: string | null;
  industry: string | null;
  wallet_address: string | null;
  logo_url: string | null;
  seeking_people: string | null;
  average_salary: number | null;
  average_age: number | null;
  strengths: string | null;
  benefits: string | null;
};

export default function CompanyProfilePublicPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("id") ?? searchParams.get("companyId");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!companyId) {
        setError("企業IDが指定されていません。");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();

      if (profileError) {
        console.warn("failed to load company profile", profileError);
        setError("企業プロフィールの取得に失敗しました。");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("企業プロフィールが見つかりません。");
        setLoading(false);
        return;
      }

      setProfile(data as CompanyProfile);
      setLoading(false);
    }

    load();
  }, [companyId]);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (error)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">読み込みに失敗しました</h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/companies"
            className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            企業検索に戻る
          </Link>
        </div>
      </main>
    );

  if (!profile)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">企業プロフィールが見つかりません</h1>
          <p className="text-gray-600">選択した企業の情報が見つかりませんでした。</p>
          <Link
            href="/companies"
            className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            企業検索に戻る
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline text-lg"
        >
          <ArrowLeft size={20} />
          企業検索に戻る
        </Link>

        <div className="flex items-center gap-4">
          {profile.logo_url ? (
            <img
              src={profile.logo_url}
              alt={`${profile.company_name ?? "企業"}のロゴ`}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🏢 {profile.company_name ?? "企業プロフィール"}
            </h1>
            <p className="text-sm text-gray-600">企業プロフィール</p>
          </div>
        </div>

        <div className="bg-white p-6 shadow-xl rounded-xl space-y-6">
          <ProfileField label="🏢 会社名" value={profile.company_name} />
          <ProfileField label="👤 担当者名" value={profile.contact_name} />
          <ProfileField label="📂 業界" value={profile.industry} />
          <ProfileField label="🎂 平均年齢" value={profile.average_age} />
          <ProfileField label="💰 平均年収" value={profile.average_salary} />
          <ProfileField label="🔑 ウォレットアドレス" value={profile.wallet_address} className="break-all text-sm" />
          <ProfileField label="🖼 ロゴURL" value={profile.logo_url} className="break-all text-sm" />
        </div>

        <SectionBlock title="💬 会社の紹介" value={profile.description} />
        <SectionBlock title="👥 求める人物像" value={profile.seeking_people} />
        <SectionBlock title="✨ 強み" value={profile.strengths} />
        <SectionBlock title="🎁 福利厚生" value={profile.benefits} />
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number | null;
  className?: string;
}) {
  const displayValue =
    value === null || value === "" ? "未登録" : typeof value === "number" ? String(value) : value;
  return (
    <div>
      <p className="font-semibold text-gray-700">{label}</p>
      <p className={`mt-1 text-gray-900 ${className ?? ""}`}>{displayValue}</p>
    </div>
  );
}

function SectionBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">{title}</h2>
      <p className="text-gray-700 whitespace-pre-line">{value || "（未入力）"}</p>
    </div>
  );
}
