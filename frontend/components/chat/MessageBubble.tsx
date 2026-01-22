import { ChatMessage } from "@/lib/chatTypes";

type MessageBubbleProps = {
  message: ChatMessage;
  isStudentView?: boolean;
};

export function MessageBubble({ message, isStudentView = false }: MessageBubbleProps) {
  const isCompany = message.sender_role === "company";
  const isStudent = message.sender_role === "student";
  const isSystem = message.sender_role === "system" || message.type === "payment_notice";
  
  // 学生ビューと企業ビューで色を変える
  const getBubbleClasses = () => {
    if (isSystem) {
      return "bg-yellow-50 border-yellow-200";
    }
    if (isStudentView) {
      // 学生ビュー: 企業メッセージは左、学生メッセージは右
      return isCompany
        ? "bg-white border-gray-200"
        : "bg-indigo-50 border-indigo-200 ml-auto";
    } else {
      // 企業ビュー: 企業メッセージは右、学生メッセージは左
      return isCompany
        ? "bg-blue-50 border-blue-200 ml-auto"
        : "bg-white border-gray-200";
    }
  };
  
  return (
    <div
      className={`p-3 rounded-lg shadow-sm border text-sm ${getBubbleClasses()}`}
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
