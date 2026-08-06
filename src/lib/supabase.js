import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase не настроен: заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env (см. .env.example)'
  )
}

// Плейсхолдер валидного вида не даёт createClient упасть при отсутствии .env —
// без него весь модуль (и всё приложение) падает на импорте.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
