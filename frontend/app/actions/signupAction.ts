"use server";

import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FormState } from "@/utils/types";

const schema = z.object({
  email: z.string(),
  password: z.string().min(8),
  repeatPassword: z.string().min(8),
}).refine(
  data => data.password === data.repeatPassword,
  {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  }
);

export async function signupAction(
  prevState: FormState,
  formData: FormData
) {
  try {
    const validatedFields = schema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      repeatPassword: formData.get('repeatPassword'),
    });
    if (!validatedFields.success) {
      return { error: validatedFields.error.message };
    }
    const serverSupabase = await getServerSupabase();
    const { data, error } = await serverSupabase.auth.signUp({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    });
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