"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackToDashboard from "@/components/BackToDashboard";
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

export default function CompanyChatPage() {
  const router = useRouter();
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
  const [newThread, setNewThread] = useState({
    studentId: "",
    amount: "",
    currency: "JPYC",
    meetingProvider: "zoom" as MeetingProvider,
    meetingLink: "",
    body: "",
  });

  const [newMessage, setNewMessage] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );
  const selectedStudentId = newThread.studentId || targetStudentId || "";

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

  async function handleStartThread() {
    if (!companyId) return;
    if (!selectedStudentId) {
      alert("学生を選択してください");
      return;
    }
    try {
      const threadId = await startOfferThread({
        companyId,
        studentId: selectedStudentId,
        amount: newThread.amount ? Number(newThread.amount) : null,
        currency: newThread.currency,
        meetingProvider: newThread.meetingProvider,
        meetingLink: newThread.meetingLink || null,
        body: newThread.body,
      });
      await loadThreads(companyId);
      selectThread(threadId);
      setNewThread({
        studentId: "",
        amount: "",
        currency: "JPYC",
        meetingProvider: "zoom",
        meetingLink: "",
        body: "",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "スレッド作成に失敗しました";
      setError(message);
    }
  }

  async function handleSendMessage() {
    if (!selectedId || !newMessage.trim()) return;
    await sendMessage({
      threadId: selectedId,
      sender: "company",
      type: "text",
      body: newMessage,
    });
    setNewMessage("");
    const msgs = await fetchMessages(selectedId);
    setMessages(msgs);
  }

  async function handleCompleteInterview() {
    if (!selectedId) return;
    await completeInterview({
      threadId: selectedId,
      notes: interviewNote,
    });
    // ステータス更新後にチャットへ完了メッセージを残す
    await sendMessage({
      threadId: selectedId,
      sender: "company",
      type: "note",
      body: "面談が完了しました",
    });
    if (interviewNote.trim()) {
      await sendMessage({
        threadId: selectedId,
        sender: "company",
        type: "note",
        body: `面談メモ: ${interviewNote}`,
      });
    }
    const msgs = await fetchMessages(selectedId);
    setMessages(msgs);
    if (companyId) await loadThreads(companyId);
    setInterviewNote("");
  }

  async function applyRecentWallet(threadId: string) {
    const wallet = await fetchThreadStudentWallet(threadId);
    if (!wallet) {
      alert("ウォレットアドレスが見つかりません");
      return;
    }
    router.push(`/company/offer-send?thread=${threadId}`);
  }

  function goToOfferSendWithSelected() {
    if (!selectedThread) return;
    const wallet = selectedThread.student?.wallet_address ?? "";
    const params = new URLSearchParams();
    if (wallet) params.set("to", wallet);
    params.set("thread", selectedThread.id);
    router.push(`/company/offer-send?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-sky-100 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackToDashboard href="/company/dashboard" />

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">💬 チャット（企業）</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
            {error}
          </div>
        )}

        {/* New thread form */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🎁 新規オファーを送る</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              学生を選択
              <select
                value={selectedStudentId}
                onChange={(e) => setNewThread((s) => ({ ...s, studentId: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
              >
                <option value="">選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.wallet_address ? `(${s.wallet_address.slice(0, 6)}...)` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-700">
              金額（任意）
              <input
                value={newThread.amount}
                onChange={(e) => setNewThread((s) => ({ ...s, amount: e.target.value }))}
                placeholder="1000"
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
              />
            </label>

            <label className="text-sm text-gray-700">
              ミーティングプロバイダ
              <select
                value={newThread.meetingProvider ?? "zoom"}
                onChange={(e) =>
                  setNewThread((s) => ({
                    ...s,
                    meetingProvider: e.target.value as MeetingProvider,
                  }))
                }
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
              >
                <option value="zoom">Zoom</option>
                <option value="gmeet">Google Meet</option>
                <option value="other">その他</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              ミーティングリンク
              <input
                value={newThread.meetingLink}
                onChange={(e) => setNewThread((s) => ({ ...s, meetingLink: e.target.value }))}
                placeholder="https://..."
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
              />
            </label>
          </div>

          <label className="text-sm text-gray-700 block mt-3">
            メッセージ本文
            <textarea
              value={newThread.body}
              onChange={(e) => setNewThread((s) => ({ ...s, body: e.target.value }))}
              rows={3}
              className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
              placeholder="熱烈オファーコメントを書いてください"
            />
          </label>

          <button
            onClick={handleStartThread}
            disabled={loadingThreads}
            className="mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            スレッドを作成して送信
          </button>
        </div>

        <div className="grid md:grid-cols-[360px_1fr] gap-4">
          {/* Thread list */}
          <div className="bg-white rounded-xl shadow p-4 space-y-3 h-[90vh] overflow-y-auto">
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
                    {t.student?.name ?? "学生"} / {t.offer_amount ?? "-"} {t.currency ?? ""}
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
          <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[90vh]">
            {selectedThread ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedThread.student?.name ?? "学生"}</p>
                    <p className="text-sm text-gray-600">
                      面談リンク: {selectedThread.meeting_link ?? "未設定"}
                    </p>
                  </div>
                  <StatusBadge status={selectedThread.status} />
                </div>

                <div className="flex-1 border rounded-lg p-3 mt-3 overflow-y-auto space-y-4 bg-gray-50">
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
                    rows={3}
                    className="flex-1 border rounded-lg p-2 bg-gray-50 min-h-[96px]"
                    placeholder="メッセージを入力"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-90"
                  >
                    送信
                  </button>
                </div>

                <div className="mt-4 grid md:grid-cols-[1.5fr_1fr] gap-4 items-end">
                  <div>
                    <label className="text-sm text-gray-700 block">面談完了メモ</label>
                    <textarea
                      value={interviewNote}
                      onChange={(e) => setInterviewNote(e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg p-2 bg-gray-50"
                    />
                    <button
                      onClick={handleCompleteInterview}
                      disabled={
                        selectedThread.status !== "accepted" &&
                        selectedThread.status !== "interview_done"
                      }
                      className="mt-2 w-full bg-emerald-600 text-white px-3 py-3 rounded-lg hover:opacity-90 disabled:opacity-60"
                    >
                      面談完了にする
                    </button>
                  </div>

                  <div className="space-y-2 flex flex-col h-full justify-end">
                    <div>
                      <label className="text-sm text-gray-700 block">送金ページへ</label>
                      <p className="text-xs text-gray-600">
                        学生ウォレットが登録済みなら事前入力された状態で /company/offer-send に移動します。
                      </p>
                    </div>
                    <button
                      onClick={goToOfferSendWithSelected}
                      className="w-full bg-emerald-600 text-white px-3 py-3 rounded-lg hover:opacity-90"
                    >
                      送金ページを開く
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600">スレッドを選択してください。</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">🧭 直近面談した学生</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentInterviewees.map((s) => (
              <div key={s.threadId} className="border rounded-lg p-3">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-gray-600 break-all">{s.wallet_address ?? "ウォレット未登録"}</p>
                <button
                  onClick={() => applyRecentWallet(s.threadId)}
                  className="mt-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-lg hover:opacity-90"
                >
                  送金ページへ
                </button>
              </div>
            ))}
            {recentInterviewees.length === 0 && <p className="text-gray-500 text-sm">データなし</p>}
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
            ? "bg-blue-50 border-blue-200 ml-auto"
            : "bg-white border-gray-200"
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
