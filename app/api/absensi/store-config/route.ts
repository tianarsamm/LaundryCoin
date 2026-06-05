import { createSupabaseServerClient } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: store, error } = await supabase
    .from('store_config')
    .select('id, lat, lng, radius_meter, jam_masuk, toleransi_menit, nama_toko')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ store })
}