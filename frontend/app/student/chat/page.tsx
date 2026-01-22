"use client";

import { useState } from "react";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";
import { StudentThreadList } from "@/components/chat/StudentThreadList";
import { StudentChatDetail } from "@/components/chat/StudentChatDetail";
import { useStudentChat } from "@/hooks/useStudentChat";

export default function StudentChatPage() {
  const {
    threads,
    selectedId,
    selectedThread,
    messages,
    loadingThreads,
    loadingMessages,
    error,
    selectThread,
    handleSendMessage,
    handleAccept,
    setError,
  } = useStudentChat();

  const [newMessage, setNewMessage] = useState("");

  async function onSendMessage() {
    await handleSendMessage(newMessage);
    setNewMessage("");
  }

  async function onAccept() {
    try {
      await handleAccept();
    } catch (e) {
      // エラーはフック内で処理済み
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

        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <StudentThreadList
            threads={threads}
            selectedId={selectedId}
            loading={loadingThreads}
            onSelectThread={selectThread}
          />

          <StudentChatDetail
            thread={selectedThread}
            messages={messages}
            loading={loadingMessages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={onSendMessage}
            onAccept={onAccept}
          />
        </div>
      </div>
    </main>
  );
}
