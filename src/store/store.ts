import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addDays, isSaturday as dfIsSaturday, parseISO, formatISO, nextSaturday } from 'date-fns'
import { Client, DataExport, Job, Settings } from './types'
import { uid } from '../utils/id'
import { supabase } from '../lib/supabase'

let isBulkSeeding = false

type Result = { ok: true } | { ok: false; error: string }

type State = {
  clients: Client[]
  jobs: Job[]
  settings: Settings
  syncFromSupabase: () => Promise<void>
  addClient: (input: Omit<Client, 'id' | 'createdAt' | 'active'> & Partial<Pick<Client, 'active'>>) => Client
  updateClient: (id: string, changes: Partial<Omit<Client, 'id' | 'createdAt'>>) => void
  deleteClient: (id: string) => void
  addJob: (dateISO: string, clientId: string, time?: string) => Result
  setJobStatus: (id: string, status: Job['status']) => void
  setJobAmount: (id: string, amount: number) => void
  setJobTime: (id: string, time?: string) => void
  toggleJobPaid: (id: string) => void
  toggleTithePaid: (id: string) => void
  deleteJob: (id: string) => void
  getDayJobs: (dateISO: string) => Job[]
  bulkAddWeekly: (clientId: string, startISO: string, time?: string, weeks?: number) => void
  updateSettings: (changes: Partial<Settings>) => void
  exportData: () => DataExport
  importData: (data: DataExport) => void
  reset: () => void
}

const initialState: Pick<State, 'clients' | 'jobs' | 'settings'> = {
  clients: [],
  jobs: [],
  settings: { dailyLimit: 10, saturdayOnly: true }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      syncFromSupabase: async () => {
        const [clientsRes, jobsRes, settingsRes] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('jobs').select('*'),
          supabase.from('settings').select('*').limit(1)
        ])
        const clients: Client[] = (clientsRes.data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          address: r.address ?? undefined,
          phone: r.phone ?? undefined,
          notes: r.notes ?? undefined,
          pricePerMow: Number(r.price_per_mow),
          frequency: r.frequency ?? undefined,
          defaultTime: r.default_time ?? undefined,
          active: !!r.active,
          createdAt: r.created_at
        }))
        const jobs: Job[] = (jobsRes.data || []).map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          date: r.date,
          time: r.time ?? undefined,
          status: r.status,
          amount: Number(r.amount),
          paid: !!r.paid,
          paidAt: r.paid_at ?? undefined,
          tithePaid: r.tithe_paid ?? undefined,
          tithePaidAt: r.tithe_paid_at ?? undefined,
          createdAt: r.created_at
        }))
        const srow = (settingsRes.data || [])[0]
        const settings: Settings = srow ? { dailyLimit: srow.daily_limit, saturdayOnly: srow.saturday_only } : get().settings
        set(() => ({ clients, jobs, settings }))
      },
      addClient: (input) => {
        const client: Client = {
          id: uid(),
          name: input.name,
          address: input.address,
          phone: input.phone,
          notes: input.notes,
          pricePerMow: input.pricePerMow,
          frequency: input.frequency ?? 'one_time',
          defaultTime: input.defaultTime,
          active: input.active ?? true,
          createdAt: new Date().toISOString()
        }
        set((s) => ({ clients: [client, ...s.clients] }))
        supabase.from('clients').insert({ id: client.id, name: client.name, address: client.address, phone: client.phone, notes: client.notes, price_per_mow: client.pricePerMow, frequency: client.frequency, default_time: client.defaultTime, active: client.active, created_at: client.createdAt }).then(() => {}).catch(() => {})
        return client
      },
      updateClient: (id, changes) => {
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
        const payload: any = {}
        if (changes.name !== undefined) payload.name = changes.name
        if (changes.address !== undefined) payload.address = changes.address
        if (changes.phone !== undefined) payload.phone = changes.phone
        if (changes.notes !== undefined) payload.notes = changes.notes
        if (changes.pricePerMow !== undefined) payload.price_per_mow = changes.pricePerMow
        if (changes.frequency !== undefined) payload.frequency = changes.frequency
        if (changes.defaultTime !== undefined) payload.default_time = changes.defaultTime
        if (changes.active !== undefined) payload.active = changes.active
        supabase.from('clients').update(payload).eq('id', id).then(() => {}).catch(() => {})
      },
      deleteClient: (id) => {
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          jobs: s.jobs.filter((j) => j.clientId !== id)
        }))
        supabase.from('clients').delete().eq('id', id).then(() => {}).catch(() => {})
      },
      addJob: (dateISO, clientId, time) => {
        const date = parseISO(dateISO)
        if (get().settings.saturdayOnly && !dfIsSaturday(date)) return { ok: false, error: 'Jobs can only be scheduled on Saturdays' }
        const dayJobs = get().jobs.filter((j) => j.date === dateISO)
        if (dayJobs.length >= get().settings.dailyLimit) return { ok: false, error: 'Daily limit reached' }
        const client = get().clients.find((c) => c.id === clientId)
        if (!client) return { ok: false, error: 'Client not found' }
        const exists = dayJobs.some((j) => j.clientId === clientId)
        if (exists) return { ok: false, error: 'Client already scheduled for this date' }
        const jobTime = time ?? client.defaultTime
        const job: Job = {
          id: uid(),
          clientId,
          date: dateISO,
          time: jobTime,
          status: 'scheduled',
          amount: client.pricePerMow,
          paid: false,
          createdAt: new Date().toISOString()
        }
        set((s) => ({ jobs: [...s.jobs, job] }))
        supabase.from('jobs').insert({ id: job.id, client_id: job.clientId, date: job.date, time: job.time, status: job.status, amount: job.amount, paid: job.paid, created_at: job.createdAt }).then(() => {}).catch(() => {})
        if (client.frequency === 'weekly' && !isBulkSeeding) {
          const start = parseISO(dateISO)
          const horizonWeeks = 26
          for (let i = 1; i <= horizonWeeks; i++) {
            const next = addDays(start, i * 7)
            const nextISO = formatISO(next, { representation: 'date' })
            const s = get()
            const dayList = s.jobs.filter((j) => j.date === nextISO)
            if (dayList.length >= s.settings.dailyLimit) continue
            const dupe = dayList.some((j) => j.clientId === clientId)
            if (dupe) continue
            const follow: Job = {
              id: uid(),
              clientId,
              date: nextISO,
              time: jobTime,
              status: 'scheduled',
              amount: client.pricePerMow,
              paid: false,
              createdAt: new Date().toISOString()
            }
            set((cur) => ({ jobs: [...cur.jobs, follow] }))
            supabase.from('jobs').insert({ id: follow.id, client_id: follow.clientId, date: follow.date, time: follow.time, status: follow.status, amount: follow.amount, paid: follow.paid, created_at: follow.createdAt }).then(() => {}).catch(() => {})
          }
        }
        return { ok: true }
      },
      setJobStatus: (id, status) => {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status } : j)) }))
        supabase.from('jobs').update({ status }).eq('id', id).then(() => {}).catch(() => {})
      },
      setJobAmount: (id, amount) => {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, amount } : j)) }))
        supabase.from('jobs').update({ amount }).eq('id', id).then(() => {}).catch(() => {})
      },
      setJobTime: (id, time) => {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, time } : j)) }))
        supabase.from('jobs').update({ time: time ?? null }).eq('id', id).then(() => {}).catch(() => {})
      },
      toggleJobPaid: (id) => {
        const now = new Date().toISOString()
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, paid: !j.paid, paidAt: !j.paid ? now : undefined } : j))
        }))
        const j = get().jobs.find((x) => x.id === id)
        const paid = !!j?.paid
        supabase.from('jobs').update({ paid, paid_at: paid ? now : null }).eq('id', id).then(() => {}).catch(() => {})
      },
      toggleTithePaid: (id) => {
        const now = new Date().toISOString()
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, tithePaid: !j.tithePaid, tithePaidAt: !j.tithePaid ? now : undefined } : j))
        }))
        const j = get().jobs.find((x) => x.id === id)
        const tithe_paid = !!j?.tithePaid
        supabase.from('jobs').update({ tithe_paid, tithe_paid_at: tithe_paid ? now : null }).eq('id', id).then(() => {}).catch(() => {})
      },
      deleteJob: (id) => {
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }))
        supabase.from('jobs').delete().eq('id', id).then(() => {}).catch(() => {})
      },
      getDayJobs: (dateISO) => get().jobs.filter((j) => j.date === dateISO),
      bulkAddWeekly: (clientId, startISO, time, weeks = 26) => {
        const client = get().clients.find((c) => c.id === clientId)
        if (!client) return
        const t = time ?? client.defaultTime
        let start = parseISO(startISO)
        if (get().settings.saturdayOnly && !dfIsSaturday(start)) start = nextSaturday(start)
        const prev = isBulkSeeding
        isBulkSeeding = true
        try {
          for (let i = 0; i < weeks; i++) {
            const d = addDays(start, i * 7)
            const iso = formatISO(d, { representation: 'date' })
            const res = get().addJob(iso, clientId, t)
            if (!res.ok) continue
          }
        } finally {
          isBulkSeeding = prev
        }
      },
      updateSettings: (changes) => {
        set((s) => ({ settings: { ...s.settings, ...changes } }))
        const s = get().settings
        supabase.from('settings').upsert({ id: 1, daily_limit: s.dailyLimit, saturday_only: s.saturdayOnly }).then(() => {}).catch(() => {})
      },
      exportData: () => ({ clients: get().clients, jobs: get().jobs, settings: get().settings }),
      importData: (data) => set(() => ({ clients: data.clients ?? [], jobs: data.jobs ?? [], settings: data.settings ?? { dailyLimit: 10, saturdayOnly: true } })),
      reset: () => set(() => ({ ...initialState }))
    }),
    {
      name: 'lawnmower-data',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
