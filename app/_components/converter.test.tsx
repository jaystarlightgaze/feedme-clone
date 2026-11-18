import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Converter } from "@/app/_components/converter";
import type { Article } from "@/lib/export";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const article: Article = {
  url: "https://example.com/post",
  title: "제목",
  author: "",
  domain: "example.com",
  markdown: "본문입니다.",
};

const writeText = vi.fn();
const open = vi.fn();
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("open", open);
  Object.assign(navigator, { clipboard: { writeText } });
  fetchMock.mockResolvedValue(Response.json({ article }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const urlInput = () => screen.getByLabelText("페이지 URL");
const button = (name: string) => screen.getByRole("button", { name });

async function convertArticle(markdown = article.markdown) {
  fetchMock.mockResolvedValue(Response.json({ article: { ...article, markdown } }));
  fireEvent.change(urlInput(), { target: { value: "https://example.com/post" } });
  fireEvent.click(button("변환"));
  await screen.findByText("제목");
}

test("결과가 없을 때 복사·다운로드·LLM 열기는 비활성화되어 있다 (기준 13)", () => {
  render(<Converter />);

  for (const name of ["복사하기", ".md 다운로드", "ChatGPT로 열기", "Claude로 열기"]) {
    expect(button(name)).toBeDisabled();
  }
  expect(screen.getByText("아직 변환한 페이지가 없어요")).toBeInTheDocument();
});

test.each(["ftp://x", "abc", ""])("%j 는 요청 없이 입력 오류를 보인다 (기준 3)", (value) => {
  render(<Converter />);

  fireEvent.change(urlInput(), { target: { value } });
  fireEvent.click(button("변환"));

  expect(screen.getByText(/입력해 주세요|시작하는 주소/)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("프롬프트 없이 복사하면 본문만, 프롬프트를 고르면 프롬프트+빈 줄+본문이 복사된다 (기준 7)", async () => {
  render(<Converter />);
  await convertArticle();

  fireEvent.click(button("복사하기"));
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  expect(writeText.mock.calls[0][0]).toMatch(/^# 제목\n\n원문: .*\n\n본문입니다\.$/);

  fireEvent.click(button("요약해줘"));
  fireEvent.click(button("복사하기"));
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
  expect(writeText.mock.calls[1][0]).toMatch(/^요약해줘\n\n# 제목/);
});

test("직접 입력 값이 복사에 쓰이고 지우기를 누르면 모두 비워진다 (기준 6, 11)", async () => {
  render(<Converter />);
  await convertArticle();

  fireEvent.click(button("직접 입력"));
  fireEvent.change(screen.getByLabelText("직접 입력한 프롬프트"), {
    target: { value: "핵심만" },
  });
  fireEvent.click(button("복사하기"));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(writeText.mock.calls[0][0]).toMatch(/^핵심만\n\n# 제목/);

  fireEvent.click(button("지우기"));

  expect(urlInput()).toHaveValue("");
  expect(screen.queryByLabelText("직접 입력한 프롬프트")).not.toBeInTheDocument();
  expect(screen.queryByText("제목")).not.toBeInTheDocument();
  expect(button("복사하기")).toBeDisabled();
  expect(button("직접 입력")).toHaveAttribute("aria-pressed", "false");
});

test("짧은 글은 새 탭으로 전체를 넘기고 잘림 안내가 없다 (기준 9)", async () => {
  render(<Converter />);
  await convertArticle();

  fireEvent.click(button("Claude로 열기"));

  expect(open).toHaveBeenCalledTimes(1);
  expect(open.mock.calls[0][0]).toMatch(/^https:\/\/claude\.ai\/new\?q=/);
  expect(screen.queryByText("본문이 길어 일부만 전달됐어요")).not.toBeInTheDocument();
});

test("긴 글은 잘라서 넘기고 화면에 잘림 안내를 보인다 (기준 10)", async () => {
  render(<Converter />);
  await convertArticle("가나다라 ".repeat(5000));

  fireEvent.click(button("ChatGPT로 열기"));

  expect(open.mock.calls[0][0]).toMatch(/^https:\/\/chatgpt\.com\/\?q=/);
  expect(screen.getByText("본문이 길어 일부만 전달됐어요")).toBeInTheDocument();
});

test("가져오기 실패 시 오류 안내를 보이고 결과 카드는 숨긴다 (기준 4)", async () => {
  fetchMock.mockResolvedValue(Response.json({ error: "fetch" }, { status: 502 }));
  render(<Converter />);

  fireEvent.change(urlInput(), { target: { value: "https://example.com/x" } });
  fireEvent.click(button("변환"));

  expect(await screen.findByText("페이지를 가져오지 못했어요")).toBeInTheDocument();
  expect(screen.queryByText("아직 변환한 페이지가 없어요")).not.toBeInTheDocument();
});
