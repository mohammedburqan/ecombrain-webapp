'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtime<T>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      let query = supabase.from(table).select('*')
      
      if (filter) {
        query = query.eq(filter.column, filter.value)
      }

      const { data: initialData } = await query
      if (initialData) {
        setData(initialData as T[])
      }
    }

    fetchData()

    // Set up realtime subscription
    let channel: RealtimeChannel

    if (filter) {
      channel = supabase
        .channel(`${table}:${filter.column}=${filter.value}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `${filter.column}=eq.${filter.value}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setData((prev) => [...prev, payload.new as T])
            } else if (payload.eventType === 'UPDATE') {
              setData((prev) =>
                prev.map((item: any) =>
                  item.id === payload.new.id ? (payload.new as T) : item
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setData((prev) =>
                prev.filter((item: any) => item.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()
    } else {
      channel = supabase
        .channel(`${table}:all`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setData((prev) => [...prev, payload.new as T])
            } else if (payload.eventType === 'UPDATE') {
              setData((prev) =>
                prev.map((item: any) =>
                  item.id === payload.new.id ? (payload.new as T) : item
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setData((prev) =>
                prev.filter((item: any) => item.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()
    }

    return () => {
      channel.unsubscribe()
    }
  }, [table, filter?.column, filter?.value])

  return data
}

