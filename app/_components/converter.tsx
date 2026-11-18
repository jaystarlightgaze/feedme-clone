"use client";

import {
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  FileTextIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { ArticleActions } from "@/app/_components/article-actions";
import { ArticleView } from "@/app/_components/article-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article } from "@/lib/export";

export type SaveResult = "created" | "updated" | "failed";
type SaveState = { article: Article; result: SaveResult | "saving" };

type FetchError = "blocked" | "fetch" | "empty";
type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; article: Article }
  | { kind: "error"; error: FetchError };

const FETCH_ERROR_COPY: Record<FetchError, { title: string; description: string }> = {
  fetch: {
    title: "페이지를 가져오지 못했어요",
    description:
      "주소가 맞는지 확인해 주세요. 사이트가 응답하지 않거나(404·500) HTML 페이지가 아닐 수 있어요.",
  },
  blocked: {
    title: "이 주소는 가져올 수 없어요",
    description:
      "내부망이나 로컬 주소(localhost, 192.168.x.x 등)는 변환할 수 없어요.",
  },
  empty: {
    title: "본문을 찾지 못했어요",
    description:
      "페이지는 열렸지만 읽을 만한 본문이 없어요. 스크립트로 내용을 그리는 페이지이거나 로그인이 필요한 페이지일 수 있어요.",
  },
};

const INVALID_URL = "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";

function validateUrl(value: string): string | null {
  if (!value) return "URL을 입력해 주세요.";
  try {
    const { protocol } = new URL(value);
    if (protocol === "http:" || protocol === "https:") return null;
  } catch {}
  return INVALID_URL;
}

export function Converter({
  save,
}: {
  /** Present only for a signed-in user; saves the converted article. */
  save?: (article: Article) => Promise<SaveResult>;
}) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  // Remounts the prompt and export controls so clearing also resets the prompt.
  const [actionsKey, setActionsKey] = useState(0);
  const inFlight = useRef<AbortController | null>(null);

  const article = status.kind === "result" ? status.article : null;

  async function convert() {
    const value = url.trim();
    const invalid = validateUrl(value);
    setUrlError(invalid);
    if (invalid) {
      inFlight.current?.abort();
      setStatus({ kind: "idle" });
      return;
    }

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus({ kind: "loading" });

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({ kind: "result", article: data.article });
        void runSave(data.article);
      } else if (data.error === "invalid") {
        setStatus({ kind: "idle" });
        setUrlError(INVALID_URL);
      } else {
        setStatus({ kind: "error", error: data.error as FetchError });
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setStatus({ kind: "error", error: "fetch" });
    }
  }

  async function runSave(target: Article) {
    if (!save) return;
    setSaveState({ article: target, result: "saving" });
    let result: SaveResult = "failed";
    try {
      result = await save(target);
    } catch (error) {
      console.error(error);
    }
    // Ignore a late answer for an article that is no longer on screen.
    setSaveState((current) =>
      current?.article === target ? { article: target, result } : current,
    );
  }

  function clearAll() {
    inFlight.current?.abort();
    setUrl("");
    setUrlError(null);
    setStatus({ kind: "idle" });
    setActionsKey((key) => key + 1);
  }

  const loading = status.kind === "loading";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          웹 페이지를 Markdown으로
        </h1>
        <p className="text-muted-foreground">
          URL을 붙여넣으면 본문만 뽑아 Markdown으로 바꿔 드려요. 복사하거나
          ChatGPT·Claude로 바로 넘길 수 있어요.
        </p>
      </section>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void convert();
        }}
      >
        <Field data-invalid={urlError ? true : undefined}>
          <FieldLabel htmlFor="url">페이지 URL</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Input
                id="url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://example.com/article"
                value={url}
                aria-invalid={urlError ? true : undefined}
                className="pr-9"
                onChange={(event) => {
                  setUrl(event.target.value);
                  setUrlError(null);
                }}
              />
              {url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="지우기"
                  className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
                  onClick={clearAll}
                >
                  <XIcon />
                </Button>
              ) : null}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2Icon className="animate-spin" /> : null}
              {loading ? "변환 중" : "변환"}
            </Button>
          </div>
          {urlError ? <FieldError>{urlError}</FieldError> : null}
        </Field>
      </form>

      {status.kind === "error" ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{FETCH_ERROR_COPY[status.error].title}</AlertTitle>
          <AlertDescription>
            {FETCH_ERROR_COPY[status.error].description}
          </AlertDescription>
        </Alert>
      ) : null}

      <ArticleActions key={actionsKey} article={article}>
        {article ? (
          <SaveNote
            signedIn={Boolean(save)}
            result={saveState?.article === article ? saveState.result : "saving"}
            onRetry={() => void runSave(article)}
          />
        ) : null}
      </ArticleActions>

      {status.kind === "idle" ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>아직 변환한 페이지가 없어요</EmptyTitle>
            <EmptyDescription>위에 URL을 붙여넣고 변환을 누르세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {loading ? (
        <div
          className="flex flex-col gap-4 rounded-xl border p-6"
          aria-busy="true"
          aria-label="변환 중"
        >
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3.5 w-2/5" />
          <div className="flex flex-col gap-2.5 pt-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        </div>
      ) : null}
      {article ? <ArticleView article={article} /> : null}
    </div>
  );
}

const NOTE = "flex flex-wrap items-center gap-1.5 text-sm";
const NOTE_LINK = "text-foreground underline underline-offset-4";

function SaveNote({
  signedIn,
  result,
  onRetry,
}: {
  signedIn: boolean;
  result: SaveResult | "saving";
  onRetry: () => void;
}) {
  if (!signedIn) {
    return (
      <p className={`${NOTE} text-muted-foreground`}>
        <BookmarkIcon className="size-3.5" />
        로그인하면 변환한 글이 자동으로 저장돼요 ·
        <Link href="/auth/login?next=/" className={NOTE_LINK}>
          로그인
        </Link>
      </p>
    );
  }
  if (result === "saving") return null;
  if (result === "failed") {
    return (
      <p role="alert" className={`${NOTE} text-destructive`}>
        <CircleAlertIcon className="size-3.5" />
        저장하지 못했어요. 변환 결과는 그대로 쓸 수 있어요 ·
        <button type="button" className="underline underline-offset-4" onClick={onRetry}>
          다시 저장
        </button>
      </p>
    );
  }
  return (
    <p role="status" className={`${NOTE} text-muted-foreground`}>
      <CheckIcon className="size-3.5" />
      {result === "updated"
        ? "이미 저장한 글이라 최신 내용으로 바꿨어요 ·"
        : "저장한 글에 담았어요 ·"}
      <Link href="/saved" className={NOTE_LINK}>
        저장한 글 보기
      </Link>
    </p>
  );
}
