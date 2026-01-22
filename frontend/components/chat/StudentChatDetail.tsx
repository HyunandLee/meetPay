import { Thread, ChatMessage } from "@/lib/chatTypes";
import { MessageBubble } from "./MessageBubble";
import { StatusBadge } from "./StatusBadge";

type StudentChatDetailProps = {
  thread: Thread | null;
  messages: ChatMessage[];
  loading: boolean;
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onAccept: () => void;
};

export function StudentChatDetail({
  thread,
  messages,
  loading,
  newMessage,
  onMessageChange,
  onSendMessage,
  onAccept,
}: StudentChatDetailProps) {
  if (!thread) {
    return (
      <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[70vh]">
        <p className="text-gray-600">スレッドを選択してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[70vh]">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{thread.company?.company_name ?? "企業"}</p>
          <p className="text-sm text-gray-600">
            面談リンク: {thread.meeting_link ?? "未設定"}
          </p>
        </div>
        <StatusBadge status={thread.status} />
      </div>

      <div className="flex-1 border rounded-lg p-3 mt-3 overflow-y-auto space-y-2 bg-gray-50">
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
          rows={2}
          className="flex-1 border rounded-lg p-2 bg-gray-50"
          placeholder="返信を入力"
        />
        <button
          onClick={onSendMessage}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-90"
        >
          送信
        </button>
      </div>

      {thread.status === "offer_sent" && (
        <div className="mt-3">
          <button
            onClick={onAccept}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            オファーを承認する
          </button>
        </div>
      )}
    </div>
  );
}
