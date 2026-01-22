import { ThreadStatus } from "@/lib/chatTypes";

export function StatusBadge({ status }: { status: ThreadStatus }) {
  const colors: Record<ThreadStatus, string> = {
    offer_sent: "bg-blue-100 text-blue-800",
    accepted: "bg-emerald-100 text-emerald-800",
    interview_done: "bg-amber-100 text-amber-800",
    paid: "bg-purple-100 text-purple-800",
    cancelled: "bg-gray-200 text-gray-700",
    expired: "bg-gray-200 text-gray-700",
  };
  
  const label: Record<ThreadStatus, string> = {
    offer_sent: "オファー送信",
    accepted: "承諾済み",
    interview_done: "面談完了",
    paid: "支払い済み",
    cancelled: "キャンセル",
    expired: "期限切れ",
  };
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${colors[status]}`}>
      {label[status]}
    </span>
  );
}
