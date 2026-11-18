import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/app/_components/app-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function SavedArticleNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <AppHeader signedIn current="saved" />
      <main className="flex flex-col gap-6 pb-16">
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionIcon />
            </EmptyMedia>
            <EmptyTitle>글을 찾을 수 없어요</EmptyTitle>
            <EmptyDescription>삭제했거나 내가 저장한 글이 아니에요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} render={<Link href="/saved" />}>
              저장한 글로 돌아가기
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  );
}
