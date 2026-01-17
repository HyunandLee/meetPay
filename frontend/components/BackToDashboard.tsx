"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

type BackToDashboardProps = {
  href?: string;
};

export default function BackToDashboard({ href }: BackToDashboardProps) {
  const pathname = usePathname();
  const [roleTarget, setRoleTarget] = useState<string | null>(null);
  const isStudentPath = pathname?.startsWith("/student");

  useEffect(() => {
    // When the user is logged in, prefer the dashboard that matches their role
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.user_metadata?.role as "student" | "company" | undefined;
      if (role === "student") setRoleTarget("/student/dashboard");
      else if (role === "company") setRoleTarget("/company/dashboard");
    });
  }, []);

  // If we're already under /company, prefer company dashboard even before auth is ready.
  const isCompanyPath = pathname?.startsWith("/company");

  const target =
    href ??
    roleTarget ??
    (isCompanyPath ? "/company/dashboard" : isStudentPath ? "/student/dashboard" : "/company/dashboard");

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
