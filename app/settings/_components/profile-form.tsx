'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function ProfileForm({
  userId,
  initialDisplayName,
}: {
  userId: string
  initialDisplayName: string
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const supabase = createClient()
    // RLS limits this update to the signed-in user's own row.
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)
      .select('id')
    setIsSaving(false)
    if (error || !data?.length) {
      toast.error('저장하지 못했습니다')
      return
    }
    toast.success('저장했습니다')
    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="display-name">표시 이름</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />
      </div>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
