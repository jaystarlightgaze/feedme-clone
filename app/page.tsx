import Link from "next/link";

import { Converter } from "@/app/_components/converter";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-6 place-items-center rounded-sm bg-primary font-mono text-xs text-primary-foreground">
            M↓
          </span>
          feedme
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={signedIn ? "/settings" : "/auth/login"}
            className="underline-offset-4 hover:underline"
          >
            {signedIn ? "설정" : "로그인"}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-col gap-6 pb-16">
        <Converter />
      </main>
    </div>
  );
}
