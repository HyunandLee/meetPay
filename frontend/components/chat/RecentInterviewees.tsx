type RecentInterviewee = {
  threadId: string;
  studentId: string;
  name: string;
  wallet_address: string | null;
};

type RecentIntervieweesProps = {
  interviewees: RecentInterviewee[];
  onApplyWallet: (threadId: string) => void;
};

export function RecentInterviewees({ interviewees, onApplyWallet }: RecentIntervieweesProps) {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">🧭 直近面談した学生</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {interviewees.map((s) => (
          <div key={s.threadId} className="border rounded-lg p-3">
            <p className="font-semibold">{s.name}</p>
            <p className="text-xs text-gray-600 break-all">
              {s.wallet_address ?? "ウォレット未登録"}
            </p>
            <button
              onClick={() => onApplyWallet(s.threadId)}
              className="mt-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-lg hover:opacity-90"
            >
              送金ページへ
            </button>
          </div>
        ))}
        {interviewees.length === 0 && <p className="text-gray-500 text-sm">データなし</p>}
      </div>
    </div>
  );
}
