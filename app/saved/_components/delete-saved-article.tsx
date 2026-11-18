"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteSavedArticle } from "@/app/saved/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Delete button with a confirmation dialog. `icon` is the compact list-row form. */
export function DeleteSavedArticle({
  id,
  title,
  icon = false,
  redirectTo,
}: {
  id: string;
  title: string;
  icon?: boolean;
  /** Where to go after deleting; stays on the page when omitted. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const deleted = await deleteSavedArticle(id);
      setOpen(false);
      if (!deleted) {
        toast.error("삭제하지 못했어요. 다시 시도해 주세요.");
        return;
      }
      toast.success("삭제했어요");
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          icon ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="삭제"
              className="text-muted-foreground hover:text-destructive"
            />
          ) : (
            <Button variant="ghost" className="text-destructive hover:text-destructive" />
          )
        }
      >
        <Trash2Icon data-icon={icon ? undefined : "inline-start"} />
        {icon ? null : "삭제"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>저장한 글을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription className="wrap-anywhere">
            &ldquo;{title}&rdquo;을(를) 목록에서 지워요. 지운 글은 되돌릴 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
