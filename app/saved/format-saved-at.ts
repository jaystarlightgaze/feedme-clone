const TIME_ZONE = "Asia/Seoul";

const dayKey = (date: Date) =>
  date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

/** List label: "방금 전", "N분 전", "N시간 전", "어제", then a date. */
export function formatSavedAtRelative(savedAt: string, now = new Date()): string {
  const date = new Date(savedAt);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 24 * 60 && dayKey(date) === dayKey(now)) {
    return `${Math.floor(minutes / 60)}시간 전`;
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60_000);
  if (dayKey(date) === dayKey(yesterday)) return "어제";

  const sameYear = dayKey(date).slice(0, 4) === dayKey(now).slice(0, 4);
  return date.toLocaleDateString("ko-KR", {
    timeZone: TIME_ZONE,
    ...(sameYear ? {} : { year: "numeric" }),
    month: "long",
    day: "numeric",
  });
}

/** Detail label, e.g. "2026. 11. 18. 오후 4:12". */
export function formatSavedAtFull(savedAt: string): string {
  return new Date(savedAt).toLocaleString("ko-KR", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
