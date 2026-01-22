"use client";

import { useEffect, useRef } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { supabase } from "@/lib/supabase/client";

/**
 * ログインしていない時にウォレットが接続されていた場合、自動的に接続解除するコンポーネント
 */
export function WalletAutoDisconnect() {
  const { isConnected } = useConnection();
  const { disconnect } = useDisconnect();
  const isConnectedRef = useRef(isConnected);

  // 最新の接続状態をrefに保持
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    async function checkAndDisconnect() {
      // ウォレットが接続されている場合のみチェック
      if (!isConnectedRef.current) {
        return;
      }

      // ログイン状態を確認
      const { data: { user } } = await supabase.auth.getUser();

      // ログインしていない場合、ウォレットを切断
      if (!user && isConnectedRef.current) {
        disconnect();
      }
    }

    // 初回マウント時と接続状態が変更された時にチェック
    checkAndDisconnect();

    // Supabaseの認証状態変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ログアウト時またはセッションがない場合、ウォレットを切断
      if (event === "SIGNED_OUT" || !session) {
        // 最新の接続状態を確認してから切断
        if (isConnectedRef.current) {
          disconnect();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [disconnect]);

  return null;
}
