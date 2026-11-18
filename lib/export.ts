/** 변환 결과. 서버가 만들고 화면과 내보내기가 함께 쓴다. */
export type Article = {
  url: string;
  title: string;
  /** 저자를 알 수 없으면 빈 문자열 */
  author: string;
  domain: string;
  markdown: string;
};

/** 제목 헤더 + 저자 + 원문 링크 + 본문. 다운로드 파일과 LLM 전달의 본문 단위. */
export function buildDocument(article: Article): string {
  const lines = [`# ${article.title}`, ""];
  if (article.author) lines.push(`저자: ${article.author}  `);
  lines.push(`원문: ${article.url}`, "", article.markdown);
  return lines.join("\n");
}

/** 프롬프트가 있으면 빈 줄 하나를 두고 본문 앞에 붙인다. */
export function buildPayload(prompt: string, article: Article): string {
  const document = buildDocument(article);
  return prompt ? `${prompt}\n\n${document}` : document;
}

const FILENAME_FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]/g;

export function downloadFileName(title: string, domain: string): string {
  const base = title.replace(FILENAME_FORBIDDEN, "").trim().slice(0, 80);
  return `${base || domain}.md`;
}
