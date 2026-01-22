import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  completeInterview,
  fetchCompanyProfileId,
  fetchMessages,
  fetchRecentInterviewees,
  fetchThreadStudentWallet,
  listCompanyThreads,
  sendMessage,
  startOfferThread,
} from "@/lib/chatApi";
import { ChatMessage, MeetingProvider, Thread } from "@/lib/chatTypes";
import { supabase } from "@/utils/supabaseClient";

type StudentOption = {
  id: string;
  name: string;
  wallet_address: string | null;
};

type RecentOption = {
  threadId: string;
  studentId: string;
  name: string;
  wallet_address: string | null;
};

type NewThreadData = {
  studentId: string;
  amount: string;
  currency: string;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  body: string;
};

export function useCompanyChat() {
  const searchParams = useSearchParams();
  const targetStudentId = searchParams.get("studentId") ?? searchParams.get("student");
  
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [recentInterviewees, setRecentInterviewees] = useState<RecentOption[]>([]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  function selectThread(nextId: string | null) {
    if (nextId && nextId !== selectedId) setLoadingMessages(true);
    setSelectedId(nextId);
  }

  async function loadThreads(id: string) {
    const list = await listCompanyThreads(id);
    setThreads(list);
    let nextSelectedId: string | null = selectedId;
    if (targetStudentId) {
      const matched = list.find((t) => t.student_id === targetStudentId);
      if (matched) nextSelectedId = matched.id;
    }
    if (!nextSelectedId && list.length > 0) nextSelectedId = list[0].id;
    if (nextSelectedId && nextSelectedId !== selectedId) {
      selectThread(nextSelectedId);
    }
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("id, name, wallet_address")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.warn("failed to load students", error);
      return;
    }
    const base = (data ?? []) as StudentOption[];
    if (targetStudentId && !base.some((s) => s.id === targetStudentId)) {
      const { data: extra, error: extraError } = await supabase
        .from("student_profiles")
        .select("id, name, wallet_address")
        .eq("id", targetStudentId)
        .maybeSingle();
      if (extraError) {
        console.warn("failed to load target student", extraError);
        setStudents(base);
        return;
      }
      if (extra) {
        setStudents([extra as StudentOption, ...base]);
        return;
      }
    }
    setStudents(base);
  }

  async function loadRecent(id: string) {
    const rows = await fetchRecentInterviewees(id);
    setRecentInterviewees(
      rows.map((r) => ({
        threadId: r.thread_id,
        studentId: r.student_id,
        name: r.student_name ?? "不明な学生",
        wallet_address: r.student_wallet,
      }))
    );
  }

  useEffect(() => {
    async function boot() {
      setLoadingThreads(true);
      const id = await fetchCompanyProfileId();
      if (!id) {
        setError("企業プロフィールが見つかりません。");
        setLoadingThreads(false);
        return;
      }
      setCompanyId(id);
      await Promise.all([loadThreads(id), loadStudents(), loadRecent(id)]);
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

  async function handleStartThread(data: NewThreadData) {
    if (!companyId) return;
    if (!data.studentId) {
      alert("学生を選択してください");
      return;
    }
    try {
      const threadId = await startOfferThread({
        companyId,
        studentId: data.studentId,
        amount: data.amount ? Number(data.amount) : null,
        currency: data.currency,
        meetingProvider: data.meetingProvider,
        meetingLink: data.meetingLink || null,
        body: data.body,
      });
      await loadThreads(companyId);
      selectThread(threadId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "スレッド作成に失敗しました";
      setError(message);
      throw e;
    }
  }

  async function handleSendMessage(message: string) {
    if (!selectedId || !message.trim()) return;
    try {
      await sendMessage({
        threadId: selectedId,
        sender: "company",
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

  async function handleCompleteInterview(note: string) {
    if (!selectedId) return;
    try {
      await completeInterview({
        threadId: selectedId,
        notes: note,
      });
      await sendMessage({
        threadId: selectedId,
        sender: "company",
        type: "note",
        body: "面談が完了しました",
      });
      if (note.trim()) {
        await sendMessage({
          threadId: selectedId,
          sender: "company",
          type: "note",
          body: `面談メモ: ${note}`,
        });
      }
      // Realtimeで自動的にメッセージが追加されるため、手動のfetchMessagesは不要
      if (companyId) await loadThreads(companyId);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "面談完了処理に失敗しました";
      setError(errorMessage);
      throw e;
    }
  }

  async function applyRecentWallet(threadId: string) {
    const wallet = await fetchThreadStudentWallet(threadId);
    if (!wallet) {
      alert("ウォレットアドレスが見つかりません");
      return;
    }
    return wallet;
  }

  return {
    // State
    threads,
    selectedId,
    selectedThread,
    messages,
    students,
    recentInterviewees,
    loadingThreads,
    loadingMessages,
    error,
    targetStudentId,
    // Actions
    selectThread,
    handleStartThread,
    handleSendMessage,
    handleCompleteInterview,
    applyRecentWallet,
    setError,
  };
}
