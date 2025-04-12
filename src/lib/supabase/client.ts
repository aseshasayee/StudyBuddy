import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL. URL must start with https://')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }