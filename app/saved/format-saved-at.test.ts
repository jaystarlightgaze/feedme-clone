import { expect, test } from "vitest";

import { formatSavedAtFull, formatSavedAtRelative } from "@/app/saved/format-saved-at";

// 2026-11-18 16:12 in Seoul.
const now = new Date("2026-11-18T07:12:00Z");

test.each([
  ["2026-11-18T07:11:40Z", "방금 전"],
  ["2026-11-18T06:47:00Z", "25분 전"],
  ["2026-11-18T04:05:00Z", "3시간 전"],
  ["2026-11-17T12:48:00Z", "어제"],
  ["2026-11-14T01:21:00Z", "11월 14일"],
  ["2025-12-30T01:00:00Z", "2025년 12월 30일"],
])("%s → %s", (savedAt, label) => {
  expect(formatSavedAtRelative(savedAt, now)).toBe(label);
});

test("상세에는 날짜와 시각을 모두 보인다", () => {
  expect(formatSavedAtFull("2026-11-18T07:12:00Z")).toMatch(/2026\. 11\. 18\. 오후 4:12/);
});
