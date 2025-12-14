import "server-only"
import { createClient } from '@supabase/supabase-js'

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
const supabase = createClient(supabaseURL, supabaseSecretKey)
export { supabase }