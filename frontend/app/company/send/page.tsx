"use client";

import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link"
import router from "next/router";
import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const sendSchema = z.object({
  receiverAddress: z.string().min(1, "学生ウォレットは必須です")
  .transform((val) => val.trim().replace(/\u200B/g, ""))
  .refine(
    (val) => /^0x[0-9a-fA-F]{40}$/.test(val),
    {
      message: "学生ウォレットは正しいアドレスではありません。",
    }
  ),
  amount: z.number().min(1, "オファー金額は必須です"),
  message: z.string().optional(),
})

interface ProfileProps {
  loading: boolean;
  profileWallet: string | null;
  addressMismatch: boolean;
}

function Profile({ loading, profileWallet, addressMismatch }: ProfileProps) {
  if (loading) {
    return <p className="text-gray-500 text-sm">プロフィールを読み込み中...</p>
  }
  if (addressMismatch) {
    return <p className="text-red-500 font-semibold">プロフィールのウォレットと接続中のウォレットが一致していません。プロフィールのウォレットで接続してください。</p>
  }
  if (!profileWallet) {
    return (
    <p className="text-red-500 font-semibold">プロフィールにウォレットアドレスを設定してください。
      <button
        onClick={() => router.push("/company/profile")}
        className="ml-2 underline text-blue-600"
      >
        プロフィール編集へ
      </button>
    </p>)
  }
  return (
    <p className="text-sm text-gray-700">
      プロフィールのウォレット:{" "}
      <span className="font-mono break-all">{profileWallet}</span>
    </p>
  )
}

export default function OfferSendPage() {

  const [mounted, setMounted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [addressMismatch, setAddressMismatch] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const { isConnected, address: connectedAddress } = useConnection();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(sendSchema),
  })

  const onSubmit = async (data: z.infer<typeof sendSchema>) => {
    // TODO: send offer
    console.log(data);
  }

  // クライアントでマウントされたことを記録
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 1. get company address from supabase
    async function getAddress() {
      // get user from supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // get company address from company_link_user
      const { data: companyData, error: companyError } = await supabase.from("company_link_user").select("company_id").eq("user_id", user.id).single();
      if (companyError) return;
      const companyId = companyData?.company_id;
      if (!companyId) return;

      // get company address from company
      const { data, error } = await supabase.from("company").select("wallet_address").eq("id", companyId).single();
      if (error || !data) return;
      console.log("data", data);
      setAddress(data.wallet_address);
    }

    getAddress().finally(() => {
      // 2. get address from connected wallet, and compare with user(company) address
      console.log("address mismatch", connectedAddress, address);
      if (connectedAddress && address && connectedAddress.toLowerCase() !== address.toLowerCase()) {
        setAddressMismatch(true);
      }
      setProfileLoading(false);
    });
  }, [])

  // マウント前は共通のローディングUIを表示（ハイドレーションエラー防止）
  if (!mounted || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>ウォレットに接続してください。</p>
      </div>
    )
  }

  if (addressMismatch) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>プロフィールのウォレットと接続中のウォレットが一致していません。プロフィールのウォレットで接続してください。</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <Link href="/company/dashboard" className="text-blue-500">&lt; Back to Dashboard</Link>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 学生へオファーを送る
        </h1>
        <div className="mb-4 space-y-2">
          <Profile loading={profileLoading} profileWallet={address} addressMismatch={addressMismatch} />
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 mb-8 mt-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="font-semibold mb-2 block">🎯 学生ウォレット</label>
              <input
                type="text"
                {...register("receiverAddress")}
                className="w-full p-3 border rounded-xl bg-gray-50"
                placeholder="0x1234..."
              />
              {errors.receiverAddress && <p className="text-red-500 text-sm">{errors.receiverAddress.message}</p>}
            </div>
            <div>
              <label className="font-semibold mb-2 block">💰 オファー金額（tJPYC）</label>
              <input
                type="number"
                {...register("amount")}
                className="w-full p-3 border rounded-xl bg-gray-50"
                placeholder="1000"
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="font-semibold mb-2 block">💬 メッセージ（任意）</label>
              <textarea
                {...register("message")}
                className="w-full p-3 border rounded-xl bg-gray-50"
                rows={4}
                placeholder="面談のご案内です！よろしくお願いします。"
              />
              {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
            >
              オファーを送る
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}