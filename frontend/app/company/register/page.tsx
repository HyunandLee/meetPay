"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function CompanyRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function register() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("登録完了！ログインしてください。");
    window.location.href = "/company/login";
  }

  return (
    <main style={{ padding: 40, maxWidth: 360 }}>
      <h1>企業アカウント作成</h1>

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
        onClick={register}
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
        登録する
      </button>
    </main>
  );
}
