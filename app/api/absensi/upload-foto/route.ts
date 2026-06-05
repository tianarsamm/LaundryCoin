import { createSupabaseServerClient } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('foto') as File
  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('absensi-foto')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('absensi-foto')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: publicUrl })
}