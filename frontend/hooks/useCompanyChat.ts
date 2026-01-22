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
    fetchMessages(selectedId)
      .then(setMessages)
      .catch((e) => setError(e.message ?? "メッセージの取得に失敗しました"))
      .finally(() => setLoadingMessages(false));
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
    await sendMessage({
      threadId: selectedId,
      sender: "company",
      type: "text",
      body: message,
    });
    const msgs = await fetchMessages(selectedId);
    setMessages(msgs);
  }

  async function handleCompleteInterview(note: string) {
    if (!selectedId) return;
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
    const msgs = await fetchMessages(selectedId);
    setMessages(msgs);
    if (companyId) await loadThreads(companyId);
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
