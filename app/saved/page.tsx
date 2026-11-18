import { BookmarkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/app/_components/app-header";
import { DeleteSavedArticle } from "@/app/saved/_components/delete-saved-article";
import { listSavedArticles } from "@/app/saved/data";
import { formatSavedAtRelative } from "@/app/saved/format-saved-at";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "저장한 글 · feedme" };

// Signed-out visitors never reach here: proxy.ts sends them to the login page.
export default async function SavedPage() {
  const articles = await listSavedArticles();
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <AppHeader signedIn current="saved" />
      <main className="flex flex-col gap-6 pb-16">
        <section className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">저장한 글</h1>
          {articles.length ? (
            <p className="text-muted-foreground">{articles.length}개 · 최근에 변환한 순서</p>
          ) : null}
        </section>

        {articles.length ? (
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {articles.map((article) => (
                <li key={article.id} className="flex items-center gap-2 py-3 pr-2 pl-4">
                  <Link
                    href={`/saved/${article.id}`}
                    className="group flex min-w-0 flex-1 flex-col gap-0.5"
                  >
                    <span className="line-clamp-2 font-medium wrap-anywhere underline-offset-4 group-hover:underline">
                      {article.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {article.domain} · {formatSavedAtRelative(article.savedAt, now)}
                    </span>
                  </Link>
                  <DeleteSavedArticle id={article.id} title={article.title} icon />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Empty className="rounded-xl border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookmarkIcon />
              </EmptyMedia>
              <EmptyTitle>아직 저장한 글이 없어요</EmptyTitle>
              <EmptyDescription>
                로그인한 상태로 변환한 글이 여기에 자동으로 모여요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
                글 변환하러 가기
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </main>
    </div>
  );
}
