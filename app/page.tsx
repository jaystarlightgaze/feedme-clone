import { AppHeader } from "@/app/_components/app-header";
import { Converter } from "@/app/_components/converter";
import { saveArticle } from "@/app/saved/actions";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <AppHeader signedIn={signedIn} />
      <main className="flex flex-col gap-6 pb-16">
        <Converter save={signedIn ? saveArticle : undefined} />
      </main>
    </div>
  );
}
