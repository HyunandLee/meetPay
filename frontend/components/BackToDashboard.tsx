"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

type BackToDashboardProps = {
  href?: string;
};

export default function BackToDashboard({ href }: BackToDashboardProps) {
  const pathname = usePathname();
  const isStudent = pathname?.startsWith("/student");
  const target = href ?? (isStudent ? "/student/dashboard" : "/company/dashboard");

  return (
    <Link
      href={target}
      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-lg mb-6"
    >
      <ArrowLeft size={20} />
      ダッシュボードに戻る
    </Link>
  );
}
