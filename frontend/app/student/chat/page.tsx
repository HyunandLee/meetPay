"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BackToDashboard from "@/components/BackToDashboard";
import Link from "next/link";
import {
  acceptThread,
  fetchMessages,
  fetchStudentProfileId,
  listStudentThreads,
  sendMessage,
} from "@/lib/chatApi";
import { ChatMessage, Thread } from "@/lib/chatTypes";

export default function StudentChatPage() {
  const searchParams = useSearchParams();
  const targetCompanyId = searchParams.get("companyId") ?? searchParams.get("company");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

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

  async function handleSend() {
    if (!selectedId || !newMessage.trim()) return;
    await sendMessage({
      threadId: selectedId,
      sender: "student",
      type: "text",
      body: newMessage,
    });
    setNewMessage("");
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
    } finally {
      setLoadingMessages(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackToDashboard href="/student/dashboard" />

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">💬 チャット（学生）</h1>
          <Link
            href="/companies"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            企業検索へ
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">{error}</div>
        )}

        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          {/* Thread list */}
          <div className="bg-white rounded-xl shadow p-4 space-y-3 h-[70vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">スレッド</h2>
            {loadingThreads && <p className="text-gray-500">読み込み中...</p>}
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => selectThread(t.id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedId === t.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {t.company?.company_name ?? "企業"} / {t.offer_amount ?? "-"} {t.currency ?? ""}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(t.updated_at).toLocaleString()}
                </div>
              </button>
            ))}
            {!loadingThreads && threads.length === 0 && (
              <p className="text-gray-500 text-sm">スレッドがまだありません。</p>
            )}
          </div>

          {/* Chat detail */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[70vh]">
            {selectedThread ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedThread.company?.company_name ?? "企業"}</p>
                    <p className="text-sm text-gray-600">
                      面談リンク: {selectedThread.meeting_link ?? "未設定"}
                    </p>
                  </div>
                  <StatusBadge status={selectedThread.status} />
                </div>

                <div className="flex-1 border rounded-lg p-3 mt-3 overflow-y-auto space-y-2 bg-gray-50">
                  {loadingMessages && <p className="text-gray-500">読み込み中...</p>}
                  {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                  {!loadingMessages && messages.length === 0 && (
                    <p className="text-sm text-gray-500">メッセージはまだありません。</p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="flex-1 border rounded-lg p-2 bg-gray-50"
                    placeholder="返信を入力"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-90"
                  >
                    送信
                  </button>
                </div>

                {selectedThread.status === "offer_sent" && (
                  <div className="mt-3">
                    <button
                      onClick={handleAccept}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
                    >
                      オファーを承認する
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">スレッドを選択してください。</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isCompany = message.sender_role === "company";
  const isSystem = message.sender_role === "system" || message.type === "payment_notice";
  return (
    <div
      className={`p-3 rounded-lg shadow-sm border text-sm ${
        isSystem
          ? "bg-yellow-50 border-yellow-200"
          : isCompany
            ? "bg-white border-gray-200"
            : "bg-indigo-50 border-indigo-200 ml-auto"
      }`}
      style={{ maxWidth: "80%" }}
    >
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
        <span>{message.sender_role}</span>
        <span>{new Date(message.created_at).toLocaleString()}</span>
        <span className="uppercase text-[10px] tracking-wide text-gray-600">{message.type}</span>
      </div>
      <div className="whitespace-pre-wrap text-gray-900">{message.body || "(本文なし)"}</div>
      {message.payload && Object.keys(message.payload).length > 0 && (
        <div className="mt-1 text-[11px] text-gray-600">
          payload: {JSON.stringify(message.payload)}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Thread["status"] }) {
  const colors: Record<Thread["status"], string> = {
    offer_sent: "bg-blue-100 text-blue-800",
    accepted: "bg-emerald-100 text-emerald-800",
    interview_done: "bg-amber-100 text-amber-800",
    paid: "bg-purple-100 text-purple-800",
    cancelled: "bg-gray-200 text-gray-700",
    expired: "bg-gray-200 text-gray-700",
  };
  const label: Record<Thread["status"], string> = {
    offer_sent: "オファー送信",
    accepted: "承諾済み",
    interview_done: "面談完了",
    paid: "支払い済み",
    cancelled: "キャンセル",
    expired: "期限切れ",
  };
  return <span className={`text-xs px-2 py-1 rounded ${colors[status]}`}>{label[status]}</span>;
}
