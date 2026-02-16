import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || ''
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ''
  const pusherAppId = process.env.PUSHER_APP_ID || ''
  const pusherSecret = process.env.PUSHER_SECRET || ''

  return NextResponse.json({
    supabase_url_length: url.length,
    supabase_url_first20: url.substring(0, 20),
    supabase_url_last10: url.substring(url.length - 10),
    supabase_key_length: key.length,
    supabase_key_first10: key.substring(0, 10),
    pusher_key_length: pusherKey.length,
    pusher_cluster: pusherCluster,
    pusher_app_id_length: pusherAppId.length,
    pusher_secret_length: pusherSecret.length,
    has_hidden_chars_url: url !== url.trim(),
    has_newline_url: url.includes('\n'),
    has_hidden_chars_key: key !== key.trim(),
    has_newline_key: key.includes('\n'),
  })
}
