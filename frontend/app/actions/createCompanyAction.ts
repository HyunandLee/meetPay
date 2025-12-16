"use server";

import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FormState } from "@/utils/types";

const schema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  walletAddress: z.string().min(1),
  logoUrl: z.string().optional(),
  seekingPeople: z.string().optional(),
  averageSalary: z.string(),
  averageAge: z.string(),
  strengths: z.string().optional(),
  benefits: z.string().optional(),
})

export async function createCompanyAction(
  prevState: FormState,
  formData: FormData
) {
  try {
    const validatedFields = schema.safeParse({
      name: formData.get("name"),
      contactName: formData.get("contactName"),
      description: formData.get("description"),
      industry: formData.get("industry"),
      walletAddress: formData.get("walletAddress"),
      logoUrl: formData.get("logoUrl"),
      seekingPeople: formData.get("seekingPeople"),
      averageSalary: formData.get("averageSalary"),
      averageAge: formData.get("averageAge"),
      strengths: formData.get("strengths"),
      benefits: formData.get("benefits"),
    });
    if (!validatedFields.success) {
      return { error: validatedFields.error.message };
    }
    console.log('validatedFields:', validatedFields);
    // const serverSupabase = await getServerSupabase();

    // const { data, error } = await serverSupabase.from("company").insert({
    //   name: validatedFields.data.name,
    //   contact_name: validatedFields.data.contactName,
    //   description: validatedFields.data.description,
    //   industry: validatedFields.data.industry,
    //   wallet_address: validatedFields.data.walletAddress,
    //   logo_url: validatedFields.data.logoUrl,
    //   seeking_people: validatedFields.data.seekingPeople,
    //   average_salary: validatedFields.data.averageSalary,
    //   average_age: validatedFields.data.averageAge,
    //   strengths: validatedFields.data.strengths,
    //   benefits: validatedFields.data.benefits,
    // });
    // if (error) {
    //   return { error: error.message };
    // }
    // console.log('data:', data);
  } catch (error) {
    console.error('Error:', error);
    return { error: (error as Error).message };
  }
  revalidatePath('/company/dashboard');
  redirect('/company/dashboard');
}