"use server";

import { revalidatePath } from "next/cache";

import type { SaveResult } from "@/app/_components/converter";
import type { Article } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

/** Keeps one saved article per source URL: a repeat conversion refreshes it. */
export async function saveArticle(article: Article): Promise<SaveResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return "failed";

  const { data: existing } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("url", article.url)
    .maybeSingle();

  const { error } = await supabase.from("saved_articles").upsert(
    {
      user_id: userId,
      url: article.url,
      title: article.title,
      author: article.author,
      domain: article.domain,
      markdown: article.markdown,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "user_id,url" },
  );
  if (error) {
    console.error(error);
    return "failed";
  }

  revalidatePath("/saved");
  return existing ? "updated" : "created";
}

/** RLS limits the delete to the signed-in user's own rows. */
export async function deleteSavedArticle(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_articles")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) console.error(error);

  revalidatePath("/saved");
  return !error && data.length > 0;
}
