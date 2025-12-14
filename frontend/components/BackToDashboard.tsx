"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackToDashboardProps = {
  href?: string;
};

export default function BackToDashboard({
  href = "/company/dashboard",
}: BackToDashboardProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-lg mb-6"
    >
      <ArrowLeft size={20} />
      ダッシュボードに戻る
    </Link>
  );
}
