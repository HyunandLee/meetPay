type OfferFormProps = {
  to: string;
  amount: string;
  message: string;
  internalPassword: string;
  isLargeAmount: boolean;
  onToChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  requiredPassword?: string;
};

export function OfferForm({
  to,
  amount,
  message,
  internalPassword,
  isLargeAmount,
  onToChange,
  onAmountChange,
  onMessageChange,
  onPasswordChange,
  requiredPassword,
}: OfferFormProps) {
  return (
    <div className="bg-white p-6 shadow-md rounded-xl space-y-6">
      <div>
        <label className="font-semibold mb-2 block">🎯 学生ウォレット</label>
        <input
          type="text"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50"
          placeholder="0x1234..."
        />
      </div>

      <div>
        <label className="font-semibold mb-2 block">💰 オファー金額（tJPYC）</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50"
          placeholder="1000"
        />
        {isLargeAmount && (
          <p className="text-red-600 text-sm mt-2">
            10,000 JPYC以上の送金です。社内承認を得ているか確認してください。
          </p>
        )}
      </div>

      <div>
        <label className="font-semibold mb-2 block">💬 メッセージ（任意）</label>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50"
          rows={4}
          placeholder="面談のご案内です！よろしくお願いします。"
        />
      </div>

      <div>
        <label className="font-semibold mb-2 block">🔒 社内パスワード</label>
        <input
          type="password"
          value={internalPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50"
          placeholder="社内パスワードを入力"
        />
        {requiredPassword === undefined && (
          <p className="text-xs text-gray-500 mt-1">
            NEXT_PUBLIC_INTERNAL_PASSWORD が設定されていないため、空以外の入力で通過します。
          </p>
        )}
      </div>
    </div>
  );
}
