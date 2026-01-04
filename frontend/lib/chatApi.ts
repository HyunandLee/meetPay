import { supabase } from "@/utils/supabaseClient";
import {
  ChatMessage,
  MeetingProvider,
  RecentInterview,
  SenderRole,
  Thread,
} from "./chatTypes";

async function requireUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  return user;
}

export async function fetchCompanyProfileId(): Promise<string | null> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (error) {
    console.warn("failed to fetch company profile id", error);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchStudentProfileId(): Promise<string | null> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (error) {
    console.warn("failed to fetch student profile id", error);
    return null;
  }
  return data?.id ?? null;
}

export async function listCompanyThreads(companyId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select(
      `
      id,
      company_id,
      student_id,
      offer_amount,
      currency,
      meeting_provider,
      meeting_link,
      status,
      last_message_at,
      updated_at,
      student:student_profiles (id, name, wallet_address),
      company:company_profiles (id, company_name)
    `
    )
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Thread[];
}

export async function listStudentThreads(studentId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select(
      `
      id,
      company_id,
      student_id,
      offer_amount,
      currency,
      meeting_provider,
      meeting_link,
      status,
      last_message_at,
      updated_at,
      student:student_profiles (id, name, wallet_address),
      company:company_profiles (id, company_name)
    `
    )
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Thread[];
}

export async function fetchMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(params: {
  threadId: string;
  sender: SenderRole;
  type: "text" | "note" | "offer" | "payment_notice" | "accept";
  body: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await supabase.rpc("post_message", {
    p_thread_id: params.threadId,
    p_sender: params.sender,
    p_type: params.type,
    p_body: params.body,
    p_payload: params.payload ?? {},
  });
  if (error) throw error;
}

export async function startOfferThread(params: {
  companyId: string;
  studentId: string;
  amount?: number | null;
  currency?: string;
  meetingProvider?: MeetingProvider;
  meetingLink?: string | null;
  body?: string;
}) {
  const { data, error } = await supabase.rpc("start_offer_thread", {
    p_company_profile_id: params.companyId,
    p_student_profile_id: params.studentId,
    p_amount: params.amount ?? null,
    p_currency: params.currency ?? "JPYC",
    p_meeting_provider: params.meetingProvider ?? null,
    p_meeting_link: params.meetingLink ?? null,
    p_body: params.body ?? "",
  });
  if (error) throw error;
  return data as string;
}

export async function acceptThread(threadId: string, body?: string) {
  const { error } = await supabase.rpc("accept_thread", {
    p_thread_id: threadId,
    p_body: body ?? "",
  });
  if (error) throw error;
}

export async function completeInterview(params: {
  threadId: string;
  happenedAt?: string;
  notes?: string;
}) {
  const { error } = await supabase.rpc("complete_interview", {
    p_thread_id: params.threadId,
    p_happened_at: params.happenedAt ?? new Date().toISOString(),
    p_notes: params.notes ?? "",
  });
  if (error) throw error;
}

export async function recordPayoutNotice(params: {
  threadId: string;
  txHash: string;
  amount?: number | null;
  body?: string;
}) {
  const { error } = await supabase.rpc("record_payout_notice", {
    p_thread_id: params.threadId,
    p_tx_hash: params.txHash,
    p_amount: params.amount ?? null,
    p_body: params.body ?? "",
  });
  if (error) throw error;
}

export async function fetchRecentInterviewees(companyId: string) {
  const { data, error } = await supabase.rpc("recent_interviews_for_company", {
    p_company_id: companyId,
  });
  if (error) throw error;
  return (data ?? []) as RecentInterview[];
}

export async function fetchThreadStudentWallet(threadId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select(
      `
        id,
        student:student_profiles (wallet_address)
      `
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw error;
  const student = (data as any)?.student as { wallet_address: string | null } | undefined;
  return student?.wallet_address ?? null;
}
