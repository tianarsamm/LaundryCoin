import { createSupabaseServerClient } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00+07:00`)
    .lte('created_at', `${today}T23:59:59+07:00`)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const checkin = data?.find(d => d.type === 'checkin') ?? null
  const checkout = data?.find(d => d.type === 'checkout') ?? null

  return NextResponse.json({ checkin, checkout })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, latitude, longitude, distance_meter, photo_url, device_info } = body

  const { data: store } = await supabase
    .from('store_config')
    .select('*')
    .single()

  if (!store) return NextResponse.json({ error: 'Store config tidak ditemukan' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('attendance_logs')
    .select('type')
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00+07:00`)
    .lte('created_at', `${today}T23:59:59+07:00`)

  const hasCheckin = existing?.some(e => e.type === 'checkin')
  const hasCheckout = existing?.some(e => e.type === 'checkout')

  if (type === 'checkin' && hasCheckin)
    return NextResponse.json({ error: 'Sudah check in hari ini' }, { status: 400 })
  if (type === 'checkout' && !hasCheckin)
    return NextResponse.json({ error: 'Belum check in' }, { status: 400 })
  if (type === 'checkout' && hasCheckout)
    return NextResponse.json({ error: 'Sudah check out hari ini' }, { status: 400 })

  let status: 'ontime' | 'late' = 'ontime'
  if (type === 'checkin') {
    const now = new Date()
    const [h, m] = store.jam_masuk.split(':').map(Number)
    const batasJam = new Date()
    batasJam.setHours(h, m + store.toleransi_menit, 0, 0)
    if (now > batasJam) status = 'late'
  }

  const ip_address = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null

  const { data: log, error } = await supabase
    .from('attendance_logs')
    .insert({ user_id: user.id, store_id: store.id, type, latitude, longitude,
      distance_meter, photo_url, status, device_info, ip_address })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kirim notifikasi push ke owner
  try {
    const { data: userData } = await supabase
      .from('users').select('nama').eq('id', user.id).single()
    const { data: admins } = await supabase
      .from('users').select('id').eq('role', 'super_admin')
    if (admins?.length) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', admins.map(a => a.id))
      if (subs?.length) {
        const jam = new Date(log.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar'
        })
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            subscriptions: subs,
            title: type === 'checkin' ? '🟢 Check In' : '🔴 Check Out',
            body: `${userData?.nama ?? 'Karyawan'} — ${jam} WITA`,
          }),
        })
      }
    }
  } catch (e) { console.error('Push error:', e) }

  return NextResponse.json({ data: log })
}