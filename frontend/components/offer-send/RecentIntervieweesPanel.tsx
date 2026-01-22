import { RecentInterview } from "@/lib/chatTypes";

type RecentIntervieweesPanelProps = {
  interviewees: RecentInterview[];
  companyId: string | null;
  onSelect: (wallet: string, threadId: string) => void;
};

export function RecentIntervieweesPanel({
  interviewees,
  companyId,
  onSelect,
}: RecentIntervieweesPanelProps) {
  return (
    <div className="max-w-xl mx-auto mt-6 bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">🧭 直近面談した学生</h2>
      <div className="space-y-2">
        {interviewees.map((r) => (
          <div
            key={r.thread_id}
            className="border rounded-lg p-3 flex items-center justify-between gap-2"
          >
            <div>
              <p className="font-semibold">{r.student_name ?? "学生"}</p>
              <p className="text-xs text-gray-600 break-all">
                {r.student_wallet ?? "ウォレット未登録"}
              </p>
              <p className="text-xs text-gray-500">
                面談日時: {new Date(r.happened_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => {
                if (r.student_wallet) onSelect(r.student_wallet, r.thread_id);
              }}
              className="text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-90"
            >
              宛先にセット
            </button>
          </div>
        ))}
        {companyId && interviewees.length === 0 && (
          <p className="text-sm text-gray-600">直近の面談データがありません。</p>
        )}
      </div>
    </div>
  );
}
