export type ThreadStatus =
  | "offer_sent"
  | "accepted"
  | "interview_done"
  | "paid"
  | "cancelled"
  | "expired";

export type MeetingProvider = "zoom" | "gmeet" | "other" | null;

export type MessageType =
  | "text"
  | "offer"
  | "accept"
  | "note"
  | "payment_notice"
  | "system";

export type SenderRole = "company" | "student" | "system";

export type Thread = {
  id: string;
  company_id: string;
  student_id: string;
  offer_amount: number | null;
  currency: string | null;
  meeting_provider: MeetingProvider;
  meeting_link: string | null;
  status: ThreadStatus;
  last_message_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
    wallet_address: string | null;
  } | null;
  company?: {
    id: string;
    company_name: string | null;
  } | null;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_role: SenderRole;
  type: MessageType;
  body: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RecentInterview = {
  thread_id: string;
  student_id: string;
  student_name: string | null;
  student_wallet: string | null;
  happened_at: string;
};
