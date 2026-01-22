import { Thread } from "@/lib/chatTypes";
import { StatusBadge } from "./StatusBadge";

type ThreadListProps = {
  threads: Thread[];
  selectedId: string | null;
  loading: boolean;
  onSelectThread: (threadId: string) => void;
};

export function ThreadList({ threads, selectedId, loading, onSelectThread }: ThreadListProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3 h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold">スレッド</h2>
      {loading && <p className="text-gray-500">読み込み中...</p>}
      {threads.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectThread(t.id)}
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
      {!loading && threads.length === 0 && (
        <p className="text-gray-500 text-sm">スレッドがまだありません。</p>
      )}
    </div>
  );
}
