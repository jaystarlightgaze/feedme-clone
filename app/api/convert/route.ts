import { convertUrl, type ConvertError } from "@/lib/convert/convert-url";

const STATUS: Record<ConvertError, number> = {
  invalid: 400,
  blocked: 403,
  empty: 422,
  fetch: 502,
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const url =
    body && typeof body === "object" && "url" in body && typeof body.url === "string"
      ? body.url
      : "";

  const result = await convertUrl(url);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: STATUS[result.error] });
  }
  return Response.json({ article: result.article });
}
