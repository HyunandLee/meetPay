"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/loginAction";
import Form from "next/form"
import Link from "next/link";

export default function CompanyLogin() {
  const [state, formAction] = useActionState(loginAction, {
    error: null as string | null,
  });
  return (
    <main className="p-6 flex min-h-screen items-center justify-center ">
      <div className=" w-full max-w-lg rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業ログイン
        </h1>

        <Form action={formAction}>
          {
            state.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                {state.error}
              </div>
            )
          }
          <label className="font-semibold block text-gray-900">Email</label>
          <input
            type="email"
            name="email"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="company@example.com"
          />
          <label className="font-semibold block text-gray-900">Password</label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="••••••••"
          />
          <button type="submit" className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition">
            ログイン
          </button>
        </Form>
        <p className="text-center text-gray-600 mt-4">
          アカウントをお持ちでないですか？{" "}
          <Link href="/company/register" className="text-blue-600 underline">
            新規登録はこちら
          </Link>
        </p>
      </div>
    </main>
  )
}