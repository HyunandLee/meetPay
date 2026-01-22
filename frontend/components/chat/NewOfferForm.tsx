import { useState } from "react";
import { MeetingProvider } from "@/lib/chatTypes";

type StudentOption = {
  id: string;
  name: string;
  wallet_address: string | null;
};

type NewOfferFormProps = {
  students: StudentOption[];
  selectedStudentId: string;
  loading: boolean;
  onSubmit: (data: {
    studentId: string;
    amount: string;
    currency: string;
    meetingProvider: MeetingProvider;
    meetingLink: string;
    body: string;
  }) => void;
};

export function NewOfferForm({
  students,
  selectedStudentId,
  loading,
  onSubmit,
}: NewOfferFormProps) {
  const [formData, setFormData] = useState({
    studentId: selectedStudentId,
    amount: "",
    currency: "JPYC",
    meetingProvider: "zoom" as MeetingProvider,
    meetingLink: "",
    body: "",
  });

  const handleSubmit = () => {
    if (!formData.studentId) {
      alert("学生を選択してください");
      return;
    }
    onSubmit(formData);
    setFormData({
      studentId: selectedStudentId,
      amount: "",
      currency: "JPYC",
      meetingProvider: "zoom",
      meetingLink: "",
      body: "",
    });
  };

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🎁 新規オファーを送る</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-sm text-gray-700">
          学生を選択
          <select
            value={formData.studentId}
            onChange={(e) => setFormData((s) => ({ ...s, studentId: e.target.value }))}
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
            value={formData.amount}
            onChange={(e) => setFormData((s) => ({ ...s, amount: e.target.value }))}
            placeholder="1000"
            className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
          />
        </label>

        <label className="text-sm text-gray-700">
          ミーティングプロバイダ
          <select
            value={formData.meetingProvider ?? "zoom"}
            onChange={(e) =>
              setFormData((s) => ({
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
            value={formData.meetingLink}
            onChange={(e) => setFormData((s) => ({ ...s, meetingLink: e.target.value }))}
            placeholder="https://..."
            className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
          />
        </label>
      </div>

      <label className="text-sm text-gray-700 block mt-3">
        メッセージ本文
        <textarea
          value={formData.body}
          onChange={(e) => setFormData((s) => ({ ...s, body: e.target.value }))}
          rows={3}
          className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
          placeholder="熱烈オファーコメントを書いてください"
        />
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
      >
        スレッドを作成して送信
      </button>
    </div>
  );
}
