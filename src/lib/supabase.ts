import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./crypto";

const config = getSupabaseConfig();

// In the browser/frontend client, use the publishable key
export const supabase = createClient(
  config.supabaseUrl,
  config.publishableKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const supabaseUrl = config.supabaseUrl;
export const supabasePublishableKey = config.publishableKey;
