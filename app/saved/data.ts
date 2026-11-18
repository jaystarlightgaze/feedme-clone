import type { Article } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

export type SavedArticle = Article & { id: string; savedAt: string };

type Row = {
  id: string;
  url: string;
  title: string;
  author: string;
  domain: string;
  markdown: string;
  saved_at: string;
};

const toSaved = ({ saved_at, ...rest }: Row): SavedArticle => ({
  ...rest,
  savedAt: saved_at,
});

export type SavedArticleSummary = Pick<SavedArticle, "id" | "title" | "domain" | "savedAt">;

/** The signed-in user's saved articles, most recently converted first. */
export async function listSavedArticles(): Promise<SavedArticleSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_articles")
    .select("id, title, domain, saved_at")
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return data.map(({ saved_at, ...rest }) => ({ ...rest, savedAt: saved_at }));
}

/** Null when the article does not exist or belongs to someone else (RLS). */
export async function getSavedArticle(id: string): Promise<SavedArticle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_articles")
    .select("id, url, title, author, domain, markdown, saved_at")
    .eq("id", id)
    .maybeSingle();
  // A malformed id is a missing article, not a server error.
  if (error) return null;
  return data ? toSaved(data as Row) : null;
}
