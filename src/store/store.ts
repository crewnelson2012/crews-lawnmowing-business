import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addDays, isSaturday as dfIsSaturday, parseISO, formatISO, nextSaturday } from 'date-fns'
import { Client, DataExport, Job, Settings } from './types'
import { uid } from '../utils/id'

let isBulkSeeding = false

type Result = { ok: true } | { ok: false; error: string }

type State = {
  clients: Client[]
  jobs: Job[]
  settings: Settings
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
        return client
      },
      updateClient: (id, changes) => set((s) => ({
        clients: s.clients.map((c) => (c.id === id ? { ...c, ...changes } : c))
      })),
      deleteClient: (id) => set((s) => ({
        clients: s.clients.filter((c) => c.id !== id),
        jobs: s.jobs.filter((j) => j.clientId !== id)
      })),
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
        // If client has weekly frequency, pre-fill upcoming Saturdays for next 26 weeks
        if (client.frequency === 'weekly' && !isBulkSeeding) {
          const start = parseISO(dateISO)
          const horizonWeeks = 26
          for (let i = 1; i <= horizonWeeks; i++) {
            const next = addDays(start, i * 7)
            const nextISO = formatISO(next, { representation: 'date' })
            // Respect daily limit and avoid duplicates
            const s = get()
            const dayList = s.jobs.filter((j) => j.date === nextISO)
            if (dayList.length >= s.settings.dailyLimit) continue
            const dupe = dayList.some((j) => j.clientId === clientId)
            if (dupe) continue
            // Create job
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
          }
        }
        return { ok: true }
      },
      setJobStatus: (id, status) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, status } : j))
      })),
      setJobAmount: (id, amount) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, amount } : j))
      })),
      setJobTime: (id, time) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, time } : j))
      })),
      toggleJobPaid: (id) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, paid: !j.paid, paidAt: !j.paid ? new Date().toISOString() : undefined } : j))
      })),
      toggleTithePaid: (id) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, tithePaid: !j.tithePaid, tithePaidAt: !j.tithePaid ? new Date().toISOString() : undefined } : j))
      })),
      deleteJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
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
      updateSettings: (changes) => set((s) => ({ settings: { ...s.settings, ...changes } })),
      exportData: () => ({ clients: get().clients, jobs: get().jobs, settings: get().settings }),
      importData: (data) => set(() => ({
        clients: data.clients ?? [],
        jobs: data.jobs ?? [],
        settings: {
          dailyLimit: data.settings?.dailyLimit ?? 10,
          saturdayOnly: data.settings?.saturdayOnly ?? true
        }
      })),
      reset: () => set(() => ({ ...initialState }))
    }),
    {
      name: 'lawnmower-data',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
