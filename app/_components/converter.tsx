"use client";

import {
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildDocument,
  buildPayload,
  downloadFileName,
  type Article,
} from "@/lib/export";
import { buildLlmLink, LLM_SERVICES, type LlmService } from "@/lib/llm-link";

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

const PRESET_PROMPTS = [
  "요약해줘",
  "한국어로 번역해줘",
  "영어로 번역해줘",
  "쉽게 설명해줘",
];
const CUSTOM = "custom";

type Truncation = { service: string; totalLength: number; sentLength: number };

const INVALID_URL = "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";

function validateUrl(value: string): string | null {
  if (!value) return "URL을 입력해 주세요.";
  try {
    const { protocol } = new URL(value);
    if (protocol === "http:" || protocol === "https:") return null;
  } catch {}
  return INVALID_URL;
}

export function Converter() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [presets, setPresets] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [truncation, setTruncation] = useState<Truncation | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const article = status.kind === "result" ? status.article : null;
  // Combine selections in display order so the result does not depend on click order.
  const prompt = [...PRESET_PROMPTS, CUSTOM]
    .filter((value) => presets.includes(value))
    .map((value) => (value === CUSTOM ? customPrompt.trim() : value))
    .filter(Boolean)
    .join("\n");

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
    setTruncation(null);

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

  function clearAll() {
    inFlight.current?.abort();
    setUrl("");
    setUrlError(null);
    setStatus({ kind: "idle" });
    setPresets([]);
    setCustomPrompt("");
    setTruncation(null);
  }

  async function copy() {
    if (!article) return;
    try {
      await navigator.clipboard.writeText(buildPayload(prompt, article));
      toast.success(prompt ? "프롬프트와 함께 복사했어요" : "복사했어요");
    } catch {
      toast.error("복사하지 못했어요. 브라우저 권한을 확인해 주세요.");
    }
  }

  function download() {
    if (!article) return;
    const name = downloadFileName(article.title, article.domain);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([buildDocument(article)], { type: "text/markdown;charset=utf-8" }),
    );
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${name} 파일을 받았어요`);
  }

  function openLlm(service: LlmService) {
    if (!article) return;
    const { label } = LLM_SERVICES[service];
    const link = buildLlmLink(service, prompt, buildDocument(article));
    setTruncation(
      link.truncated
        ? { service: label, totalLength: link.totalLength, sentLength: link.sentLength }
        : null,
    );
    window.open(link.url, "_blank", "noopener,noreferrer");
    toast.success(`${label} 새 대화를 새 탭에서 열었어요`);
  }

  const loading = status.kind === "loading";
  const actionButtons: {
    label: string;
    icon: typeof CopyIcon;
    run: () => void;
  }[] = [
    { label: "복사하기", icon: CopyIcon, run: copy },
    { label: ".md 다운로드", icon: DownloadIcon, run: download },
    { label: "ChatGPT로 열기", icon: ExternalLinkIcon, run: () => openLlm("chatgpt") },
    { label: "Claude로 열기", icon: ExternalLinkIcon, run: () => openLlm("claude") },
  ];

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

      <section className="flex flex-col gap-2.5" aria-label="프롬프트">
        <div className="flex items-baseline gap-1.5 text-sm font-medium">
          프롬프트
          <small className="font-normal text-muted-foreground">
            여러 개 고르면 차례로 본문 앞에 붙어요
          </small>
        </div>
        <ToggleGroup
          variant="outline"
          spacing={1.5}
          className="flex-wrap"
          multiple
          value={presets}
          onValueChange={(values) => {
            setPresets(values);
            setTruncation(null);
          }}
        >
          {PRESET_PROMPTS.map((text) => (
            <ToggleGroupItem
              key={text}
              value={text}
              className="rounded-full data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              {text}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem
            value={CUSTOM}
            className="rounded-full data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            직접 입력
          </ToggleGroupItem>
        </ToggleGroup>
        {presets.includes(CUSTOM) ? (
          <Input
            aria-label="직접 입력한 프롬프트"
            placeholder="예: 핵심 주장 3개와 반론을 정리해줘"
            value={customPrompt}
            autoFocus
            onChange={(event) => {
              setCustomPrompt(event.target.value);
              setTruncation(null);
            }}
          />
        ) : null}
      </section>

      <section className="flex flex-col gap-2.5" aria-label="내보내기">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {actionButtons.map(({ label, icon: Icon, run }) => (
            <Button
              key={label}
              variant="outline"
              disabled={!article}
              onClick={run}
            >
              <Icon data-icon="inline-start" />
              {label}
            </Button>
          ))}
        </div>
        {article && truncation ? (
          <Alert role="status">
            <TriangleAlertIcon />
            <AlertTitle>본문이 길어 일부만 전달됐어요</AlertTitle>
            <AlertDescription>
              전체 {truncation.totalLength.toLocaleString()}자 중 앞부분 약{" "}
              {truncation.sentLength.toLocaleString()}자만 {truncation.service}에
              넘겼어요. 전체가 필요하면 복사하기로 붙여넣으세요.
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

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
