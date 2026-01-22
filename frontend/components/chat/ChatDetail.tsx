import { Thread, ChatMessage } from "@/lib/chatTypes";
import { MessageBubble } from "./MessageBubble";
import { StatusBadge } from "./StatusBadge";

// 企業ビュー用のMessageBubble（isStudentView=falseがデフォルト）

type ChatDetailProps = {
  thread: Thread | null;
  messages: ChatMessage[];
  loading: boolean;
  newMessage: string;
  interviewNote: string;
  onMessageChange: (message: string) => void;
  onInterviewNoteChange: (note: string) => void;
  onSendMessage: () => void;
  onCompleteInterview: () => void;
  onGoToOfferSend: () => void;
};

export function ChatDetail({
  thread,
  messages,
  loading,
  newMessage,
  interviewNote,
  onMessageChange,
  onInterviewNoteChange,
  onSendMessage,
  onCompleteInterview,
  onGoToOfferSend,
}: ChatDetailProps) {
  if (!thread) {
    return (
      <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[90vh]">
        <p className="text-gray-600">スレッドを選択してください。</p>
      </div>
    );
  }

  const canCompleteInterview =
    thread.status === "accepted" || thread.status === "interview_done";

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[90vh]">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{thread.student?.name ?? "学生"}</p>
          <p className="text-sm text-gray-600">
            面談リンク: {thread.meeting_link ?? "未設定"}
          </p>
        </div>
        <StatusBadge status={thread.status} />
      </div>

      <div className="flex-1 border rounded-lg p-3 mt-3 overflow-y-auto space-y-4 bg-gray-50">
        {loading && <p className="text-gray-500">読み込み中...</p>}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-gray-500">メッセージはまだありません。</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={3}
          className="flex-1 border rounded-lg p-2 bg-gray-50 min-h-[96px]"
          placeholder="メッセージを入力"
        />
        <button
          onClick={onSendMessage}
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
            onChange={(e) => onInterviewNoteChange(e.target.value)}
            rows={3}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
          <button
            onClick={onCompleteInterview}
            disabled={!canCompleteInterview}
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
            onClick={onGoToOfferSend}
            className="w-full bg-emerald-600 text-white px-3 py-3 rounded-lg hover:opacity-90"
          >
            送金ページを開く
          </button>
        </div>
      </div>
    </div>
  );
}
