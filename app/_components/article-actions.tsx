"use client";

import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildDocument,
  buildPayload,
  downloadFileName,
  type Article,
} from "@/lib/export";
import { buildLlmLink, LLM_SERVICES, type LlmService } from "@/lib/llm-link";

const PRESET_PROMPTS = [
  "요약해줘",
  "한국어로 번역해줘",
  "영어로 번역해줘",
  "쉽게 설명해줘",
];
const CUSTOM = "custom";

type Truncation = {
  article: Article;
  service: string;
  totalLength: number;
  sentLength: number;
};

/**
 * Prompt selection, then the export row, for one article (see export-actions).
 * Buttons stay disabled until there is an article. `children` renders under the row.
 */
export function ArticleActions({
  article,
  children,
}: {
  article: Article | null;
  children?: ReactNode;
}) {
  const [presets, setPresets] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [truncation, setTruncation] = useState<Truncation | null>(null);

  // Combine selections in display order so the result does not depend on click order.
  const prompt = [...PRESET_PROMPTS, CUSTOM]
    .filter((value) => presets.includes(value))
    .map((value) => (value === CUSTOM ? customPrompt.trim() : value))
    .filter(Boolean)
    .join("\n");

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
        ? {
            article,
            service: label,
            totalLength: link.totalLength,
            sentLength: link.sentLength,
          }
        : null,
    );
    window.open(link.url, "_blank", "noopener,noreferrer");
    toast.success(`${label} 새 대화를 새 탭에서 열었어요`);
  }

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

  // A notice only belongs to the article it was raised for.
  const notice = article && truncation?.article === article ? truncation : null;

  return (
    <>
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
        {notice ? (
          <Alert role="status">
            <TriangleAlertIcon />
            <AlertTitle>본문이 길어 일부만 전달됐어요</AlertTitle>
            <AlertDescription>
              전체 {notice.totalLength.toLocaleString()}자 중 앞부분 약{" "}
              {notice.sentLength.toLocaleString()}자만 {notice.service}에
              넘겼어요. 전체가 필요하면 복사하기로 붙여넣으세요.
            </AlertDescription>
          </Alert>
        ) : null}
        {children}
      </section>
    </>
  );
}
