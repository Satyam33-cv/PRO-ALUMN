// frontend/lib/supabase.ts
// Supabase client instance for frontend direct queries, realtime, and storage

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbcswrdndqylswladdue.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KMSA3PCR4AZjNa6ALkjnaA_I_E_Wjrm";

// Simple fetch-based Supabase REST helper for direct Supabase table/storage operations if needed
export async function supabaseFetch(table: string, queryParams: Record<string, string> = {}) {
  const params = new URLSearchParams(queryParams).toString();
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? `?${params}` : ""}`;
  
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase query failed: ${res.statusText}`);
  }

  return res.json();
}
