"use client";

import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { useConnection } from "wagmi";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { type Company } from "@/utils/types";

export function Company() {
  const { isConnected, address } = useConnection();
  // get user from supabase

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getCompany() {
      const { data: { user } } = await supabase.auth.getUser();
      if (isConnected && address) {
        const { data, error } = await supabase.from("company").select("*").eq("wallet_address", address).single();
        // console.log(data);
        return data
      }
      if (user) {
        const { data, error } = await supabase.from("company_link_user").select("*").eq("user_id", user.id).single();
        if (error) {
          return;
        }
        const company_id = data?.company_id;
        if (company_id) {
          const { data, error } = await supabase.from("company").select("*").eq("id", company_id).single();
          if (error) {
            console.error(error);
            return;
          }
          return data;
        }
      }
      return null;
    }
    setIsLoading(true);
    getCompany().then((data) => {
      setCompany(data as Company);
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    });
  }, [isConnected, address]);

  return (
    <div className="w-2/3 mx-auto justify-center">
      {
        isLoading && (
          <div>
            <p>Loading...</p>
          </div>
        )
      }
      {
        !isLoading && isConnected && (
          <>
            {
              company && (
                <>
                  <CompanyInfo company={company} />
                </>
              )
            }
            {
              !company && (
                <div>
                  <Link href="/company/create" className="bg-blue-500 text-white px-4 py-2 rounded-md">Create</Link>
                </div>
              )
            }
          </>
        )
      }
    </div>
  )
}

function CompanyInfo({ company }: { company: Company }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        🏢 {company.name}
      </h1>

      {/* ---- メニューエリア ---- */}
      <div className="mt-10 grid grid-cols-1 gap-4">

        {/* 学生を探す */}
        <DashboardButton
          href="/company/students"
          label="🔍 学生を探す"
          color="from-blue-500 to-blue-700"
        />

        {/* チャットへ */}
        <DashboardButton
          href="/company/chat"
          label="💬 チャット"
          color="from-amber-500 to-orange-600"
        />

        {/* 送金履歴 */}
        <DashboardButton
          href="/company/offers"
          label="📜 送金（オファー）履歴"
          color="from-gray-600 to-gray-800"
        />

        {/* 新規オファー送信 */}
        <DashboardButton
          href="/company/offer-send"
          label="🎁 学生にオファーを送る"
          color="from-green-500 to-emerald-600"
        />

        {/* プロフィール編集 */}
        <DashboardButton
          href="/company/profile"
          label="✏️ プロフィールを編集"
          color="from-purple-600 to-indigo-600"
        />

      </div>

      {/* 会社概要 */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 mb-8 mt-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          📄 会社概要
        </h2>

        <InfoRow label="業界" value={company.industry} />
        <InfoRow label="平均年齢" value={company.averageAge?.toString()} />
        <InfoRow label="平均年収" value={company.averageSalary?.toString()} />
        <InfoRow label="強み" value={company.strengths} />
      </div>

      {/* 紹介文 */}
      <SectionBlock title="💬 会社の紹介" value={company.description} />

      {/* 求める人物像 */}
      <SectionBlock title="👥 求める人物像" value={company.seekingPeople} />

      {/* 福利厚生 */}
      <SectionBlock title="🎁 福利厚生" value={company.benefits} />


    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-800 dark:text-gray-200">{value || "未設定"}</span>
    </div>
  );
}

function SectionBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">{title}</h2>
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {value || "（未入力）"}
      </p>
    </div>
  );
}

function DashboardButton({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`block text-center py-4 rounded-xl text-white font-semibold text-lg shadow bg-linear-to-r ${color} hover:opacity-90 transition`}
    >
      {label}
    </Link>
  );
}