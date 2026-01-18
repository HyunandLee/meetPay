"use client";

import { useActionState, useState, useEffect } from "react";
import { updateCompanyAction } from "@/app/actions/updateCompanyAction";
import Form from "next/form";
import { useConnection, useConnections } from "wagmi";
import { WalletOptions } from "@/components/wallet/WalletOption";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { type Company } from "@/utils/types";

export default function CompanyEditPage() {
  const [state, formAction] = useActionState(
    updateCompanyAction,
    { error: null as string | null },
  );
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const connections = useConnections();

  // 既存の企業データを取得
  useEffect(() => {
    async function loadCompany() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Auth error:', userError);
          setLoading(false);
          return;
        }

        if (!user) {
          console.error('User not found - user is null');
          setLoading(false);
          return;
        }

        console.log('User found:', user.id);

        // company_link_userからcompany_idを取得
        const { data: linkData, error: linkError } = await supabase
          .from("company_link_user")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (linkError) {
          console.error('Link error:', linkError);
          setLoading(false);
          return;
        }

        if (!linkData) {
          console.error('Company link not found');
          setLoading(false);
          return;
        }

        console.log('Company ID:', linkData.company_id);

        // 企業情報を取得
        const { data, error } = await supabase
          .from("company")
          .select("*")
          .eq("id", linkData.company_id as string)
          .single();

        if (error) {
          console.error('Company fetch error:', error);
          setLoading(false);
          return;
        }

        if (data) {
          console.log('Company data loaded:', data);
          // データベースのスネークケースをキャメルケースにマッピング
          const mappedCompany: Company = {
            id: data.id,
            name: data.name,
            contactName: data.contact_name || undefined,
            description: data.description || undefined,
            industry: data.industry || undefined,
            walletAddress: data.wallet_address || "",
            logoUrl: data.logo_url || undefined,
            seekingPeople: data.seeking_people || undefined,
            averageSalary: data.average_salary || undefined,
            averageAge: data.average_age || 0,
            strengths: data.strengths || undefined,
            benefits: data.benefits || undefined,
          };
          setCompany(mappedCompany);
          setWalletAddress(data.wallet_address);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    // Company.tsxと同じように少し遅延を入れる
    setTimeout(() => {
      loadCompany();
    }, 100);
  }, []);

  function putMyAddressToForm() {
    if (connections[0]?.accounts[0]) {
      setWalletAddress(connections[0]?.accounts[0]);
    }
  }

  function ConnectWallet() {
    const { isConnected } = useConnection();
    if (isConnected) {
      return (
        <>
          <ConnectButton />
          <button 
            type="button" 
            onClick={putMyAddressToForm}
            className="w-full py-3 my-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
          >
            ウォレットアドレスを入力
          </button>
        </>
      );
    }
    return <WalletOptions />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <main className="p-6 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">企業情報が見つかりませんでした。</p>
          <Link href="/company/dashboard" className="text-blue-500">ダッシュボードに戻る</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2 dark:text-white">
          ✏️ 企業情報編集
        </h1>

        <Form action={formAction}>
          {state.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl dark:text-white dark:bg-red-500">
              {state.error}
            </div>
          )}
          
          <label className="font-semibold block text-gray-900 dark:text-white">Company Name</label>
          <input
            type="text"
            name="name"
            defaultValue={company.name}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Your Company Inc."
            required
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Contact Name</label>
          <input
            type="text"
            name="contactName"
            defaultValue={company.contactName || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="John Doe"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Description</label>
          <textarea
            name="description"
            defaultValue={company.description || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Tell us about your company"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Industry</label>
          <input
            type="text"
            name="industry"
            defaultValue={company.industry || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Technology"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Wallet Address</label>
          <input
            type="text"
            name="walletAddress"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="0x1234567890abcdef1234567890abcdef12345678"
            required
            readOnly
            value={walletAddress ?? ""}
          />
          <ConnectWallet />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Logo URL</label>
          <input
            type="text"
            name="logoUrl"
            defaultValue={company.logoUrl || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="https://example.com/logo.png"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Seeking People</label>
          <textarea
            name="seekingPeople"
            defaultValue={company.seekingPeople || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We are looking for a full-stack developer who is proficient in React and Node.js."
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Average Salary</label>
          <input
            type="number"
            name="averageSalary"
            defaultValue={company.averageSalary?.toString() || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="100000"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Average Age</label>
          <input
            type="number"
            name="averageAge"
            defaultValue={company.averageAge?.toString() || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="25"
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Strengths</label>
          <textarea
            name="strengths"
            defaultValue={company.strengths || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We are a company that is committed to providing a great work environment and opportunities for growth."
          />
          
          <label className="font-semibold block text-gray-900 dark:text-white">Benefits</label>
          <textarea
            name="benefits"
            defaultValue={company.benefits || ""}
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We offer a competitive salary, health insurance, and a 401(k) plan."
          />
          
          <div className="flex gap-4">
            <Link 
              href="/company/dashboard"
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl text-lg font-semibold hover:opacity-90 transition text-center dark:bg-gray-700 dark:text-white"
            >
              キャンセル
            </Link>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition dark:text-white"
            >
              更新する
            </button>
          </div>
        </Form>
      </div>
    </main>
  );
}