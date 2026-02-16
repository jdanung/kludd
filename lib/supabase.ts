import { createClient } from '@supabase/supabase-js'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  // Ta bort ALLA radbrytningar, mellanslag i början/slutet och andra skräptecken
  return val
    .replace(/[\r\n\t]/g, '') // Ta bort radbrytningar, tabbar
    .replace(/\s+$/g, '') // Ta bort whitespace i slutet
    .replace(/^\s+/g, '') // Ta bort whitespace i början
    .trim()
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
