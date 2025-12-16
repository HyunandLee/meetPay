"use client";

import Form from "next/form";
import { useActionState } from "react";
import { signupAction } from "@/app/actions/signupAction";

export default function CompanySignup() {
  const [state, formAction] = useActionState(signupAction, {
    error: null as string | null,
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業登録
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
            autoComplete="new-password"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="••••••••"
          />
          <label className="font-semibold block text-gray-900">Repeat Password</label>
          <input
            type="password"
            name="repeatPassword"
            autoComplete="new-password"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="••••••••"
          />
          <button type="submit" className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition">
            登録する
          </button>
        </Form>
      </div>
    </main>
  )
}