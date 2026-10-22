import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;
export const BUCKET = "site-assets";

export async function uploadBlob(path: string, blob: Blob, contentType?: string): Promise<string> {
  if (!supabase) throw new Error("Supabase configured na");
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: contentType || blob.type || "application/octet-stream",
    cacheControl: "3600",
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
