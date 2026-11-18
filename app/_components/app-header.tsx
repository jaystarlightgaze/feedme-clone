import Link from "next/link";

import { ThemeToggle } from "@/app/_components/theme-toggle";

const LINK = "underline-offset-4 hover:underline aria-[current=page]:font-semibold";

export function AppHeader({
  signedIn,
  current,
}: {
  signedIn: boolean;
  current?: "saved";
}) {
  return (
    <header className="flex items-center justify-between border-b pb-2">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="grid size-6 place-items-center rounded-sm bg-primary font-mono text-xs text-primary-foreground">
          M↓
        </span>
        feedme
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/saved"
          className={LINK}
          aria-current={current === "saved" ? "page" : undefined}
        >
          저장한 글
        </Link>
        <Link href={signedIn ? "/settings" : "/auth/login"} className={LINK}>
          {signedIn ? "설정" : "로그인"}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
