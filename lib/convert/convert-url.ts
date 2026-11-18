import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

import type { Article } from "@/lib/export";
import { isLocalHostname, isPublicAddress } from "@/lib/convert/safe-url";

export type ConvertError = "invalid" | "blocked" | "fetch" | "empty";
export type ConvertResult =
  | { ok: true; article: Article }
  | { ok: false; error: ConvertError };

/** 테스트에서 네트워크와 DNS를 바꿔 끼우기 위한 의존성. */
export type ConvertDeps = {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  lookup: (
    hostname: string,
  ) => Promise<{ address: string; family: number }[]>;
};

const defaultDeps: ConvertDeps = {
  fetch: (url, init) => fetch(url, init),
  lookup: (hostname) => dnsLookup(hostname, { all: true }),
};

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;

class BlockedError extends Error {}

export async function convertUrl(
  input: string,
  deps: ConvertDeps = defaultDeps,
): Promise<ConvertResult> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "invalid" };
  }

  let page: { html: string; finalUrl: string };
  try {
    page = await fetchHtml(url, deps);
  } catch (error) {
    return { ok: false, error: error instanceof BlockedError ? "blocked" : "fetch" };
  }

  const { document } = parseHTML(page.html);
  let result;
  try {
    result = await Defuddle(document as unknown as Document, page.finalUrl, {
      markdown: true,
    });
  } catch {
    return { ok: false, error: "empty" };
  }

  const markdown = result.content?.trim() ?? "";
  if (!markdown) return { ok: false, error: "empty" };

  const domain = new URL(page.finalUrl).hostname;
  return {
    ok: true,
    article: {
      url: page.finalUrl,
      title: result.title?.trim() || domain,
      author: result.author?.trim() ?? "",
      domain,
      markdown,
    },
  };
}

async function fetchHtml(start: URL, deps: ConvertDeps) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url, deps);
    const response = await deps.fetch(url.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; feedme-md/1.0)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect without location");
      url = new URL(location, url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("unsupported redirect protocol");
      }
      continue;
    }

    if (!response.ok) throw new Error(`status ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (!/\b(text\/html|application\/xhtml\+xml)\b/i.test(type)) {
      throw new Error("not html");
    }
    const charset = type.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
    const bytes = await response.arrayBuffer();
    let html: string;
    try {
      html = new TextDecoder(charset).decode(bytes);
    } catch {
      html = new TextDecoder("utf-8").decode(bytes);
    }
    return { html, finalUrl: url.href };
  }
  throw new Error("too many redirects");
}

async function assertPublic(url: URL, deps: ConvertDeps) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicAddress(host)) throw new BlockedError();
    return;
  }
  if (isLocalHostname(host)) throw new BlockedError();
  const addresses = await deps.lookup(host);
  if (addresses.length === 0) throw new Error("no address");
  if (addresses.some((a) => !isPublicAddress(a.address))) {
    throw new BlockedError();
  }
}
