export type FormState = {
  error: string | null;
}

export type Company = {
  id: string;
  name: string;
  contactName?: string;
  description?: string;
  industry?: string;
  walletAddress: string;
  logoUrl?: string;
  seekingPeople?: string;
  averageSalary?: number;
  averageAge: number;
  strengths?: string;
  benefits?: string;
}