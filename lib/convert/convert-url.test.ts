// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

import { convertUrl, type ConvertDeps } from "@/lib/convert/convert-url";

const publicLookup: ConvertDeps["lookup"] = async () => [
  { address: "93.184.216.34", family: 4 },
];

const html = (body: string, head = "") =>
  `<!doctype html><html><head><title>t</title>${head}</head><body>${body}</body></html>`;

const ARTICLE = html(
  `<nav><a href="/home">NAVIGATION-MENU</a></nav>
   <article><h1>기사 제목</h1>
   <p>${"본문 문장입니다. 충분히 긴 문단이어야 본문으로 인식됩니다. ".repeat(20)}</p>
   <p>자세한 내용은 <a href="/docs/guide">가이드</a>를 보세요.</p>
   <img src="/img/a.png" alt="그림"></article>
   <footer>FOOTER-COPYRIGHT</footer>`,
  `<meta property="og:title" content="기사 제목"><meta name="author" content="김저자">`,
);

const htmlResponse = (text: string, init: ResponseInit = {}) =>
  new Response(text, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    ...init,
  });

const deps = (fetchImpl: ConvertDeps["fetch"]): ConvertDeps => ({
  fetch: fetchImpl,
  lookup: publicLookup,
});

describe("convertUrl 성공 (기준 1, 2)", () => {
  test("제목·저자·본문 Markdown을 돌려주고 주변 요소는 빼며 링크를 절대 URL로 바꾼다", async () => {
    const result = await convertUrl(
      "https://example.com/posts/1",
      deps(async () => htmlResponse(ARTICLE)),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.title).toBe("기사 제목");
    expect(result.article.author).toBe("김저자");
    expect(result.article.domain).toBe("example.com");
    expect(result.article.url).toBe("https://example.com/posts/1");
    expect(result.article.markdown).toContain("본문 문장입니다");
    expect(result.article.markdown).not.toContain("NAVIGATION-MENU");
    expect(result.article.markdown).not.toContain("FOOTER-COPYRIGHT");
    expect(result.article.markdown).toContain(
      "(https://example.com/docs/guide)",
    );
    expect(result.article.markdown).toContain("https://example.com/img/a.png");
  });
});

describe("convertUrl 오류 구분 (기준 3, 4, 5)", () => {
  test.each(["ftp://x", "abc", ""])(
    "%j 는 요청 없이 invalid 다",
    async (input) => {
      const fetchSpy = vi.fn();
      const result = await convertUrl(input, deps(fetchSpy));

      expect(result).toEqual({ ok: false, error: "invalid" });
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  test.each([
    "http://localhost",
    "http://127.0.0.1",
    "http://10.0.0.5",
    "http://192.168.1.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
  ])("%s 는 가져오지 않고 blocked 다", async (url) => {
    const fetchSpy = vi.fn();
    const result = await convertUrl(url, deps(fetchSpy));

    expect(result).toEqual({ ok: false, error: "blocked" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("DNS가 사설 주소로 풀리는 이름은 blocked 다", async () => {
    const fetchSpy = vi.fn();
    const result = await convertUrl("http://internal.example.com", {
      fetch: fetchSpy,
      lookup: async () => [{ address: "10.0.0.8", family: 4 }],
    });

    expect(result).toEqual({ ok: false, error: "blocked" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("사설 주소로 리다이렉트되면 따라가지 않고 blocked 다", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://169.254.169.254/" },
        }),
    );
    const result = await convertUrl("https://example.com/r", deps(fetchSpy));

    expect(result).toEqual({ ok: false, error: "blocked" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("공개 주소 사이의 리다이렉트는 따라간다", async () => {
    const fetchSpy = vi
      .fn<ConvertDeps["fetch"]>()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: "/final" } }),
      )
      .mockResolvedValueOnce(htmlResponse(ARTICLE));
    const result = await convertUrl("https://example.com/old", deps(fetchSpy));

    expect(result.ok).toBe(true);
    expect(fetchSpy.mock.calls[1][0]).toBe("https://example.com/final");
  });

  test("네트워크 오류는 fetch 오류다", async () => {
    const result = await convertUrl(
      "https://no-such-domain.example",
      deps(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    expect(result).toEqual({ ok: false, error: "fetch" });
  });

  test("DNS 조회 실패는 fetch 오류다", async () => {
    const result = await convertUrl("https://no-such-domain.example", {
      fetch: vi.fn(),
      lookup: async () => {
        throw new Error("ENOTFOUND");
      },
    });

    expect(result).toEqual({ ok: false, error: "fetch" });
  });

  test("404 응답은 fetch 오류다", async () => {
    const result = await convertUrl(
      "https://example.com/missing",
      deps(async () => htmlResponse("not found", { status: 404 })),
    );

    expect(result).toEqual({ ok: false, error: "fetch" });
  });

  test("HTML이 아닌 응답(이미지)은 fetch 오류다", async () => {
    const result = await convertUrl(
      "https://example.com/a.png",
      deps(
        async () =>
          new Response("binary", { headers: { "content-type": "image/png" } }),
      ),
    );

    expect(result).toEqual({ ok: false, error: "fetch" });
  });

  test("본문이 없는 HTML은 empty 오류다", async () => {
    const result = await convertUrl(
      "https://example.com/spa",
      deps(async () => htmlResponse(html('<div id="root"></div>'))),
    );

    expect(result).toEqual({ ok: false, error: "empty" });
  });
});
