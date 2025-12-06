"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToDashboard() {
  return (
    <Link
      href="/company/dashboard"
      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-lg mb-6"
    >
      <ArrowLeft size={20} />
      ダッシュボードに戻る
    </Link>
  );
}
