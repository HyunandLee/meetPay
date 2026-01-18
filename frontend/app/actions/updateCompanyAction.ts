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
  averageSalary: z.string().transform(val => val ? parseFloat(val) : null),
  averageAge: z.string().transform(val => val ? parseInt(val) : null),
  strengths: z.string().optional(),
  benefits: z.string().optional(),
})

export async function updateCompanyAction(
  prevState: FormState,
  formData: FormData
) {
  try {
    const serverSupabase = await getServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    // ユーザーに関連する企業IDを取得
    const { data: linkData, error: linkError } = await serverSupabase
      .from("company_link_user")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (linkError || !linkData || !linkData.company_id) {
      console.error('Link error:', linkError);
      console.error('Link data:', linkData);
      return { error: "Company not found" };
    }

    console.log('Company ID from link:', linkData.company_id);

    // 企業レコードが存在するか確認
    const { data: existingCompany, error: checkError } = await serverSupabase
      .from("company")
      .select("id, name")
      .eq("id", linkData.company_id)
      .single();

    if (checkError || !existingCompany) {
      console.error('Company check error:', checkError);
      console.error('Existing company:', existingCompany);
      return { error: `企業情報が見つかりませんでした。ID: ${linkData.company_id}` };
    }

    console.log('Existing company found:', existingCompany);

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
    })

    if (!validatedFields.success) {
      console.error('Validation error:', validatedFields.error);
      return { error: validatedFields.error.message };
    }

    console.log('Updating company:', linkData.company_id);
    console.log('Update data:', validatedFields.data);

    // 企業情報を更新（空文字列はnullに変換）
    const updateData: Record<string, any> = {
      name: validatedFields.data.name,
      contact_name: validatedFields.data.contactName || null,
      description: validatedFields.data.description || null,
      industry: validatedFields.data.industry || null,
      wallet_address: validatedFields.data.walletAddress,
      logo_url: validatedFields.data.logoUrl || null,
      seeking_people: validatedFields.data.seekingPeople || null,
      average_salary: validatedFields.data.averageSalary,
      average_age: validatedFields.data.averageAge,
      strengths: validatedFields.data.strengths || null,
      benefits: validatedFields.data.benefits || null,
    };

    console.log('Update payload:', updateData);
    console.log('Company ID:', linkData.company_id);

    // 更新を実行（.single()は使わない）
    const { data: updatedData, error } = await serverSupabase
      .from("company")
      .update(updateData)
      .eq("id", linkData.company_id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return { error: error.message };
    }

    // 更新された行数を確認
    if (!updatedData) {
      console.error('No rows updated');
      return { error: "更新に失敗しました。企業情報が見つかりませんでした。" };
    }

    console.log('Update successful:', updatedData);
  } catch (error) {
    console.error('Error:', error);
    return { error: (error as Error).message };
  }

  // キャッシュを無効化
  revalidatePath('/company/dashboard');
  revalidatePath('/company/edit');
  redirect('/company/dashboard');
}