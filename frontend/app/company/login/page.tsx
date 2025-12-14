"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/browserClient";

export default function CompanyLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // ログイン成功 → ダッシュボードへ
    window.location.href = "/company/dashboard";
  }

  return (
    <main style={{ padding: 40, maxWidth: 360 }}>
      <h1>企業ログイン</h1>

      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <button
        onClick={login}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 10,
        }}
      >
        ログイン
      </button>

      <p style={{ marginTop: 20 }}>
        アカウントがありませんか？{" "}
        <a href="/company/register" style={{ color: "#3b82f6" }}>
          新規作成
        </a>
      </p>
    </main>
  );
}
