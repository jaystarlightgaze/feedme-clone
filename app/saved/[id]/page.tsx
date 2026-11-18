import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/app/_components/app-header";
import { ArticleActions } from "@/app/_components/article-actions";
import { ArticleView } from "@/app/_components/article-view";
import { DeleteSavedArticle } from "@/app/saved/_components/delete-saved-article";
import { getSavedArticle } from "@/app/saved/data";
import { formatSavedAtFull } from "@/app/saved/format-saved-at";

export async function generateMetadata({
  params,
}: PageProps<"/saved/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = await getSavedArticle(id);
  return { title: `${article?.title ?? "저장한 글"} · feedme` };
}

// Shows the snapshot taken when the article was saved; the source is not fetched again.
export default async function SavedArticlePage({ params }: PageProps<"/saved/[id]">) {
  const { id } = await params;
  const saved = await getSavedArticle(id);
  if (!saved) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <AppHeader signedIn current="saved" />
      <main className="flex flex-col gap-6 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <Link href="/saved" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-4" />
            저장한 글
          </Link>
          <div className="flex items-center gap-2">
            <span>{formatSavedAtFull(saved.savedAt)}에 저장</span>
            <DeleteSavedArticle id={id} title={saved.title} redirectTo="/saved" />
          </div>
        </div>
        <ArticleActions article={saved} />
        <ArticleView article={saved} />
      </main>
    </div>
  );
}
