"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackToDashboard from "@/components/BackToDashboard";
import { ThreadList } from "@/components/chat/ThreadList";
import { NewOfferForm } from "@/components/chat/NewOfferForm";
import { ChatDetail } from "@/components/chat/ChatDetail";
import { RecentInterviewees } from "@/components/chat/RecentInterviewees";
import { useCompanyChat } from "@/hooks/useCompanyChat";

export default function CompanyChatPage() {
  const router = useRouter();
  const {
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
    selectThread,
    handleStartThread,
    handleSendMessage,
    handleCompleteInterview,
    applyRecentWallet,
    setError,
  } = useCompanyChat();

  const [newMessage, setNewMessage] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const selectedStudentId = targetStudentId || "";

  async function onStartThread(data: Parameters<typeof handleStartThread>[0]) {
    try {
      await handleStartThread(data);
    } catch (e) {
      // エラーはフック内で処理済み
    }
  }

  async function onSendMessage() {
    await handleSendMessage(newMessage);
    setNewMessage("");
  }

  async function onCompleteInterview() {
    await handleCompleteInterview(interviewNote);
    setInterviewNote("");
  }

  async function onApplyRecentWallet(threadId: string) {
    const wallet = await applyRecentWallet(threadId);
    if (wallet) {
      router.push(`/company/offer-send?thread=${threadId}`);
    }
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
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              閉じる
            </button>
          </div>
        )}

        <NewOfferForm
          students={students}
          selectedStudentId={selectedStudentId}
          loading={loadingThreads}
          onSubmit={onStartThread}
        />

        <div className="grid md:grid-cols-[360px_1fr] gap-4">
          <ThreadList
            threads={threads}
            selectedId={selectedId}
            loading={loadingThreads}
            onSelectThread={selectThread}
          />

          <ChatDetail
            thread={selectedThread}
            messages={messages}
            loading={loadingMessages}
            newMessage={newMessage}
            interviewNote={interviewNote}
            onMessageChange={setNewMessage}
            onInterviewNoteChange={setInterviewNote}
            onSendMessage={onSendMessage}
            onCompleteInterview={onCompleteInterview}
            onGoToOfferSend={goToOfferSendWithSelected}
          />
        </div>

        <RecentInterviewees
          interviewees={recentInterviewees}
          onApplyWallet={onApplyRecentWallet}
        />
      </div>
    </main>
  );
}
