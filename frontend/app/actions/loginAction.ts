'use server';

import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FormState } from "@/utils/types";

const schema = z.object({
  email: z.string(),
  password: z.string().min(8),
})

export async function loginAction(
  prevState: FormState,
  formData: FormData
) {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!validatedFields.success) {
    return { error: validatedFields.error.message };
  }
  try {
    const serverSupabase = await getServerSupabase();
    const { data, error } = await serverSupabase.auth.signInWithPassword({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    })
    if (error) {
      return { error: error.message };
    }
    console.log('data:', data);
  } catch (error) {
    console.error('Error:', error);
    return { error: (error as Error).message };
  }
  revalidatePath('/company');
  redirect('/company/dashboard');
}