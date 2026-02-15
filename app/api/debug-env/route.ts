import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return NextResponse.json({
    url_length: url.length,
    url_first10: url.substring(0, 10),
    url_last10: url.substring(url.length - 10),
    url_charCodes_last5: Array.from(url.slice(-5)).map(c => c.charCodeAt(0)),
    key_length: key.length,
    key_first10: key.substring(0, 10),
    key_last10: key.substring(key.length - 10),
    key_charCodes_last5: Array.from(key.slice(-5)).map(c => c.charCodeAt(0)),
    key_trimmed_length: key.trim().length,
    key_replaced_length: key.replace(/[^a-zA-Z0-9._\-]/g, '').length,
    all_env_keys_with_supa: Object.keys(process.env).filter(k => k.toLowerCase().includes('supa')),
  })
}
