import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }, [session?.user])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    refreshProfile()
  }, [session?.user, refreshProfile])

  async function signUp({ email, password, name, city }) {
    // Профиль в public.users создаёт триггер on_auth_user_created (см.
    // supabase/migrations/0002_user_profile_trigger.sql) из этих metadata —
    // клиентский insert сюда не нужен и не пройдёт RLS до подтверждения email.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, city } },
    })
    if (error) return { error }
    return { data, needsEmailConfirmation: !data.session }
  }

  async function signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}
