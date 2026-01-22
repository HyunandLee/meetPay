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
    fetchMessages(selectedId)
      .then(setMessages)
      .catch((e) => setError(e.message ?? "メッセージの取得に失敗しました"))
      .finally(() => setLoadingMessages(false));
  }, [selectedId]);

  async function handleSendMessage(message: string) {
    if (!selectedId || !message.trim()) return;
    await sendMessage({
      threadId: selectedId,
      sender: "student",
      type: "text",
      body: message,
    });
    const msgs = await fetchMessages(selectedId);
    setMessages(msgs);
  }

  async function handleAccept() {
    if (!selectedId) return;
    try {
      await acceptThread(selectedId, "オファーを承認しました");
      setLoadingMessages(true);
      const msgs = await fetchMessages(selectedId);
      setMessages(msgs);
      if (studentId) {
        const list = await listStudentThreads(studentId);
        setThreads(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "承認処理に失敗しました");
      throw e;
    } finally {
      setLoadingMessages(false);
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
