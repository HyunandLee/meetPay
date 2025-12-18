"use client";

import { useActionState, useState } from "react";
import { createCompanyAction } from "@/app/actions/createCompanyAction";
import Form from "next/form";
import { useConnection, useConnections } from "wagmi";
import { WalletOptions } from "@/components/wallet/WalletOption";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function CompanyCreate() {
  const [state, formAction] = useActionState(
    createCompanyAction,
    { error: null as string | null },
  )
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const connections = useConnections();
  function putMyAddressToForm() {

    if (connections[0]?.accounts[0]) {
      setWalletAddress(connections[0]?.accounts[0]);
    }
  }

  function ConnectWallet() {
    const { isConnected } = useConnection()
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
      )
    }
    return <WalletOptions />
  }

  return (
    <main className="p-6 flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業情報入力
        </h1>

        <Form action={formAction}>
          {
            state.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                {state.error}
              </div>
            )
          }
          {/* <input type="hidden" name="userId" value={user.id} /> */}
          <label className="font-semibold block text-gray-900">Company Name</label>
          <input
            type="text"
            name="name"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Your Company Inc."
            required
          />
          <label className="font-semibold block text-gray-900">Contact Name</label>
          <input
            type="text"
            name="contactName"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="John Doe"
          />
          <label className="font-semibold block text-gray-900">Description</label>
          <textarea
            name="description"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Tell us about your company"
          />
          <label className="font-semibold block text-gray-900">Industry</label>
          <input
            type="text"
            name="industry"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="Technology"
          />
          <label className="font-semibold block text-gray-900">Wallet Address</label>
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
          
          <label className="font-semibold block text-gray-900">Logo URL</label>
          <input
            type="text"
            name="logoUrl"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="https://example.com/logo.png"
          />
          <label className="font-semibold block text-gray-900">Seeking People</label>
          <textarea
            name="seekingPeople"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We are looking for a full-stack developer who is proficient in React and Node.js."
          />
          <label className="font-semibold block text-gray-900">Average Salary</label>
          <input
            type="number"
            name="averageSalary"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="100000"
          />
          <label className="font-semibold block text-gray-900">Average Age</label>
          <input
            type="number"
            name="averageAge"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="25"
          />
          <label className="font-semibold block text-gray-900">Strengths</label>
          <textarea
            name="strengths"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We are a company that is committed to providing a great work environment and opportunities for growth."
          />
          <label className="font-semibold block text-gray-900">Benefits</label>
          <textarea
            name="benefits"
            className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
            placeholder="We offer a competitive salary, health insurance, and a 401(k) plan."
          />
          <button type="submit" className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition">
            登録する
          </button>
        </Form>
      </div>
    </main>
  )
}