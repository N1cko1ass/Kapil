import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReports({ category, status, city } = {}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)
    if (city) query = query.eq('city', city)

    const { data, error } = await query
    if (error) setError(error)
    else setReports(data ?? [])
    setLoading(false)
  }, [category, status, city])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { reports, loading, error, refetch }
}
