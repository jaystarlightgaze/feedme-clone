import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 변환 전에는 내보내기 버튼이 비활성화되어 있다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/feedme/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Markdown"
  );
  await expect(page.getByRole("button", { name: "복사하기" })).toBeDisabled();
});
