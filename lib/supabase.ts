import { createClient } from '@supabase/supabase-js'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  // Ta bort allt efter första radbrytningen och trimma whitespace
  return val.split('\n')[0].trim()
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('MISSING SUPABASE ENV VARS:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
