import { describe, expect, test } from "vitest";

import { buildLlmLink, LLM_SERVICES, TRUNCATION_MARK } from "@/lib/llm-link";

const readQ = (url: string) => new URL(url).searchParams.get("q");

describe("buildLlmLink", () => {
  test.each([
    ["chatgpt", "https://chatgpt.com/?q="],
    ["claude", "https://claude.ai/new?q="],
  ] as const)(
    "%s: 짧은 글은 전체를 그대로 넘기고 잘리지 않는다 (기준 9)",
    (service, prefix) => {
      const result = buildLlmLink(service, "요약해줘", "짧은 본문");

      expect(result.truncated).toBe(false);
      expect(result.url.startsWith(prefix)).toBe(true);
      expect(readQ(result.url)).toBe("요약해줘\n\n짧은 본문");
    },
  );

  test("프롬프트가 없으면 본문만 넘긴다", () => {
    expect(readQ(buildLlmLink("claude", "", "본문").url)).toBe("본문");
  });

  test.each(["chatgpt", "claude"] as const)(
    "%s: 한도를 넘으면 프롬프트는 온전히 두고 본문 뒤를 자르며 끝에 잘림 표시를 붙인다 (기준 10)",
    (service) => {
      const prompt = "한국어로 번역해줘";
      const body = "가나다라마바사 ".repeat(5000);
      const result = buildLlmLink(service, prompt, body);
      const sent = readQ(result.url)!;

      expect(result.truncated).toBe(true);
      expect(result.url.length).toBeLessThanOrEqual(
        LLM_SERVICES[service].maxUrlLength,
      );
      expect(sent.startsWith(`${prompt}\n\n`)).toBe(true);
      expect(sent.endsWith(TRUNCATION_MARK)).toBe(true);
      expect(sent.length).toBeLessThan(prompt.length + body.length);
      expect(sent).toContain("가나다라마바사");
    },
  );

  test("잘라도 이모지 같은 서로게이트 쌍을 깨뜨리지 않는다", () => {
    const result = buildLlmLink("claude", "", "😀".repeat(5000));

    expect(() => decodeURIComponent(result.url.split("?q=")[1])).not.toThrow();
  });
});
