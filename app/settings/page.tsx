import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './_components/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Authorize from the server-verified identity, never from client state.
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login?next=/settings')
  }

  const userId = data.claims.sub
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">설정</h1>
        <LogoutButton />
      </header>
      <p className="text-sm text-muted-foreground">{data.claims.email}</p>
      <ProfileForm userId={userId} initialDisplayName={profile?.display_name ?? ''} />
    </div>
  )
}
