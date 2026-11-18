import { describe, expect, test } from "vitest";

import {
  buildDocument,
  buildPayload,
  downloadFileName,
  type Article,
} from "@/lib/export";

const article: Article = {
  url: "https://example.com/post",
  title: "제목",
  author: "홍길동",
  domain: "example.com",
  markdown: "본문입니다.",
};

describe("buildPayload (기준 7)", () => {
  test("프롬프트가 없으면 본문 문서만 반환한다", () => {
    expect(buildPayload("", article)).toBe(buildDocument(article));
  });

  test("프롬프트는 빈 줄 하나를 두고 본문 앞에 붙는다", () => {
    expect(buildPayload("요약해줘", article)).toBe(
      `요약해줘\n\n${buildDocument(article)}`,
    );
  });
});

describe("buildDocument (기준 8)", () => {
  test("제목 헤더, 저자, 원문 링크, 본문을 담고 프롬프트는 없다", () => {
    expect(buildDocument(article)).toBe(
      "# 제목\n\n저자: 홍길동  \n원문: https://example.com/post\n\n본문입니다.",
    );
  });

  test("저자가 없으면 저자 줄을 생략한다", () => {
    expect(buildDocument({ ...article, author: "" })).toBe(
      "# 제목\n\n원문: https://example.com/post\n\n본문입니다.",
    );
  });
});

describe("downloadFileName (기준 8)", () => {
  test("제목에서 파일명에 쓸 수 없는 문자를 뺀다", () => {
    expect(downloadFileName('a/b:c*d?"e<f>g|h\\i', "example.com")).toBe(
      "abcdefghi.md",
    );
  });

  test("제목이 없으면 도메인을 쓴다", () => {
    expect(downloadFileName("", "example.com")).toBe("example.com.md");
  });
});
