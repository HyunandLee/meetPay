import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { type Company } from "@/utils/types";

type CompanyRow = Database["public"]["Tables"]["company"]["Row"];

function convertSnakeToCamel(data: CompanyRow | null): Company | null {
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    contactName: data.contact_name ?? undefined,
    description: data.description ?? undefined,
    industry: data.industry ?? undefined,
    walletAddress: data.wallet_address ?? "",
    logoUrl: data.logo_url ?? undefined,
    seekingPeople: data.seeking_people ?? undefined,
    averageSalary: data.average_salary ?? undefined,
    averageAge: data.average_age ?? 0,
    strengths: data.strengths ?? undefined,
    benefits: data.benefits ?? undefined,
  }
}

/**
 * 企業情報を取得する関数
 * ウォレットアドレスまたはユーザーIDから企業情報を取得します
 * 
 * @param isConnected - ウォレットが接続されているかどうか
 * @param address - ウォレットアドレス
 * @returns 企業情報、またはnull
 */
export async function getCompany(
  isConnected: boolean,
  address: string | undefined
): Promise<Company | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      // ユーザー取得エラーでも続行（ウォレット接続の場合）
    }
    
    // ウォレットアドレスから企業情報を取得
    if (isConnected && address) {
      try {
        const { data, error } = await supabase
          .from("company")
          .select("*")
          .eq("wallet_address", address)
          .single();
        
        if (error) {
          // データが見つからない場合（PGRST116）は正常なケースなので、エラーをログに出力しない
          if (error.code !== "PGRST116") {
            console.error("Error fetching company by wallet address:", error);
          }
          return null;
        }

        return convertSnakeToCamel(data);
      } catch (networkError: any) {
        console.error("Network error fetching company by wallet address:", networkError);
        return null;
      }
    }
    
    // ユーザーIDから企業情報を取得
    if (user) {
      try {
        const { data, error } = await supabase
          .from("company_link_user")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          // データが見つからない場合（PGRST116）は正常なケースなので、エラーをログに出力しない
          if (error.code !== "PGRST116") {
            console.error("Error fetching company link:", error);
          }
          return null;
        }
        
        const company_id = data?.company_id;
        if (company_id) {
          try {
            const { data: companyData, error: companyError } = await supabase
              .from("company")
              .select("*")
              .eq("id", company_id)
              .single();
            
            if (companyError) {
              console.error("Error fetching company by ID:", companyError);
              return null;
            }
            console.log("companyData", companyData);
            return companyData as unknown as Company | null;
          } catch (networkError: any) {
            console.error("Network error fetching company by ID:", networkError);
            return null;
          }
        }
      } catch (networkError: any) {
        console.error("Network error fetching company link:", networkError);
        return null;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error("Unexpected error in getCompany:", error);
    return null;
  }
}
