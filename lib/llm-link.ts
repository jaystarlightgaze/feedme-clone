export type LlmService = "chatgpt" | "claude";

/**
 * 서비스별 새 대화 주소와 "인코딩된 전체 주소" 길이 한도.
 *
 * 두 서비스의 `?q=` 허용 길이는 공식 문서에 없고 직접 검증하지 못했다.
 * 일반적인 웹 서버/CDN의 요청 줄 한도(대략 8KB)보다 낮은 8,000자로 보수적으로 잡았다.
 * 한글은 인코딩하면 글자당 9자라서 한글 본문은 약 800자까지만 담긴다.
 * 서비스 쪽 실제 한도를 확인하면 이 값만 바꾸면 된다.
 */
export const LLM_SERVICES: Record<
  LlmService,
  { label: string; base: string; maxUrlLength: number }
> = {
  chatgpt: {
    label: "ChatGPT",
    base: "https://chatgpt.com/?q=",
    maxUrlLength: 8000,
  },
  claude: {
    label: "Claude",
    base: "https://claude.ai/new?q=",
    maxUrlLength: 8000,
  },
};

export const TRUNCATION_MARK = "…(이하 생략: 원문이 길어 일부만 포함됨)";

export type LlmLink = {
  url: string;
  truncated: boolean;
  /** 잘리기 전 전체 글자 수 */
  totalLength: number;
  /** 실제로 넘긴 글자 수 */
  sentLength: number;
};

/**
 * 프롬프트(선택)와 본문으로 LLM 새 대화 주소를 만든다.
 * 한도를 넘으면 프롬프트는 두고 본문 뒤를 잘라 끝에 잘림 표시를 붙인다.
 */
export function buildLlmLink(
  service: LlmService,
  prompt: string,
  body: string,
): LlmLink {
  const { base, maxUrlLength } = LLM_SERVICES[service];
  const head = prompt ? `${prompt}\n\n` : "";
  const toUrl = (text: string) => base + encodeURIComponent(text);

  const full = head + body;
  if (toUrl(full).length <= maxUrlLength) {
    return {
      url: toUrl(full),
      truncated: false,
      totalLength: full.length,
      sentLength: full.length,
    };
  }

  // 서로게이트 쌍이 깨지지 않도록 코드 포인트 단위로 자른다.
  const chars = Array.from(body);
  const build = (count: number) =>
    head + chars.slice(0, count).join("") + `\n\n${TRUNCATION_MARK}`;
  let low = 0;
  let high = chars.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (toUrl(build(mid)).length <= maxUrlLength) low = mid;
    else high = mid - 1;
  }

  const text = build(low);
  return {
    url: toUrl(text),
    truncated: true,
    totalLength: full.length,
    sentLength: text.length,
  };
}
