"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";
import { supabase } from "@/utils/supabaseClient";

type Company = {
  id: string;
  company_name: string | null;
  industry: string | null;
  description: string | null;
  strengths: string | null;
  benefits: string | null;
  seeking_people: string | null;
  logo_url: string | null;
};

export default function CompanySearchPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("company_profiles")
        .select(
          "id, company_name, industry, description, strengths, benefits, seeking_people, logo_url"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("failed to load companies", error);
        return;
      }
      setCompanies((data ?? []) as Company[]);
    }

    load();
  }, []);

  const filtered = companies.filter((c) => {
    const text = `${c.company_name ?? ""} ${c.industry ?? ""} ${c.description ?? ""} ${
      c.strengths ?? ""
    } ${c.benefits ?? ""} ${c.seeking_people ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">
        <BackToDashboard href="/student/dashboard" />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">🏢 企業を探す</h1>

        <input
          type="text"
          className="w-full p-3 mb-6 border rounded-xl bg-white shadow"
          placeholder="企業名・業界・強みで検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-4">
          {filtered.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}

          {filtered.length === 0 && (
            <p className="text-gray-500 text-center mt-10">該当する企業がいません。</p>
          )}
        </div>
      </div>
    </main>
  );
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="bg-white p-6 shadow rounded-xl space-y-2">
      <div className="flex items-center gap-3">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={`${company.company_name ?? "企業"}のロゴ`}
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : null}
        <h2 className="text-xl font-bold">{company.company_name ?? "企業名未登録"}</h2>
      </div>

      <p className="text-gray-600">🏷 業界: {company.industry ?? "未登録"}</p>

      <p className="text-gray-700">💬 {company.description ?? "紹介文なし"}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/companies/me?id=${encodeURIComponent(company.id)}`}
          className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          プロフィールを見る
        </Link>
        <Link
          href={`/student/chat?companyId=${encodeURIComponent(company.id)}`}
          className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          チャットする
        </Link>
      </div>
    </div>
  );
}
