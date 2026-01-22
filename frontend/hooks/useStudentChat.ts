import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  acceptThread,
  fetchMessages,
  fetchStudentProfileId,
  listStudentThreads,
  sendMessage,
} from "@/lib/chatApi";
import { ChatMessage, Thread } from "@/lib/chatTypes";
import { supabase } from "@/utils/supabaseClient";

export function useStudentChat() {
  const searchParams = useSearchParams();
  const targetCompanyId = searchParams.get("companyId") ?? searchParams.get("company");
  
  const [studentId, setStudentId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  function selectThread(nextId: string | null) {
    if (nextId && nextId !== selectedId) setLoadingMessages(true);
    setSelectedId(nextId);
  }

  useEffect(() => {
    async function boot() {
      setLoadingThreads(true);
      const id = await fetchStudentProfileId();
      if (!id) {
        setError("学生プロフィールが見つかりません。");
        setLoadingThreads(false);
        return;
      }
      setStudentId(id);
      const list = await listStudentThreads(id);
      setThreads(list);
      let nextSelectedId: string | null = null;
      if (targetCompanyId) {
        const matched = list.find((t) => t.company_id === targetCompanyId);
        if (matched) nextSelectedId = matched.id;
      }
      if (!nextSelectedId && list.length > 0) nextSelectedId = list[0].id;
      if (nextSelectedId) selectThread(nextSelectedId);
      setLoadingThreads(false);
    }
    boot().catch((e) => {
      console.error(e);
      setError("初期化でエラーが発生しました");
      setLoadingThreads(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    
    // 初期メッセージ取得
    fetchMessages(selectedId)
      .then(setMessages)
      .catch((e) => setError(e.message ?? "メッセージの取得に失敗しました"))
      .finally(() => setLoadingMessages(false));

    // Supabase Realtime購読
    const channel = supabase
      .channel(`thread:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // 重複チェック（既に存在するメッセージは追加しない）
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to thread: ${selectedId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for thread: ${selectedId}`);
          setError('リアルタイム接続に失敗しました。ページを再読み込みしてください。');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  async function handleSendMessage(message: string) {
    if (!selectedId || !message.trim()) return;
    try {
      await sendMessage({
        threadId: selectedId,
        sender: "student",
        type: "text",
        body: message,
      });
      // Realtimeで自動的にメッセージが追加されるため、手動のfetchMessagesは不要
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "メッセージの送信に失敗しました";
      setError(errorMessage);
      throw e;
    }
  }

  async function handleAccept() {
    if (!selectedId) return;
    try {
      await acceptThread(selectedId, "オファーを承認しました");
      // acceptThread内でメッセージが作成されるため、Realtimeで自動的に追加される
      // ただし、スレッドステータスの変更を反映するためにスレッド一覧を更新
      if (studentId) {
        const list = await listStudentThreads(studentId);
        setThreads(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "承認処理に失敗しました");
      throw e;
    }
  }

  return {
    // State
    threads,
    selectedId,
    selectedThread,
    messages,
    loadingThreads,
    loadingMessages,
    error,
    // Actions
    selectThread,
    handleSendMessage,
    handleAccept,
    setError,
  };
}
