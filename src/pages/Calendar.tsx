import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns'

export default function CalendarPage() {
  const jobs = useStore((s) => s.jobs)
  const clients = useStore((s) => s.clients)

  const [cursor, setCursor] = useState<Date>(new Date())

  const fmtTime = (t?: string) => {
    if (!t) return ''
    const [hh, mm] = t.split(':')
    let h = Number(hh)
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${mm} ${ampm}`
  }

  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [cursor])

  const jobsByDate = useMemo(() => {
    const map = new Map<string, { id: string; name: string; time?: string; status: 'scheduled' | 'completed' | 'canceled' }[]>()
    for (const j of jobs) {
      const c = clients.find((x) => x.id === j.clientId)
      const name = c?.name || 'Unknown'
      const arr = map.get(j.date) || []
      arr.push({ id: j.id, name, time: j.time, status: j.status })
      map.set(j.date, arr)
    }
    return map
  }, [jobs, clients])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md border" onClick={() => setCursor((d) => subMonths(d, 1))}>Prev</button>
          <div className="font-semibold">{format(cursor, 'MMMM yyyy')}</div>
          <button className="px-3 py-1.5 rounded-md border" onClick={() => setCursor((d) => addMonths(d, 1))}>Next</button>
        </div>
        <button className="px-3 py-1.5 rounded-md border" onClick={() => setCursor(new Date())}>Today</button>
      </div>

      <div className="bg-white border rounded-xl p-3">
        <div className="grid grid-cols-7 text-xs text-gray-500 font-medium px-1 pb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (<div key={w} className="text-center">{w}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {range.map((day) => {
            const iso = format(day, 'yyyy-MM-dd')
            const dayJobs = (jobsByDate.get(iso) || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const muted = !isSameMonth(day, cursor)
            const today = isToday(day)
            return (
              <div key={iso} className={`min-h-28 rounded-lg border p-2 ${muted ? 'bg-gray-50 text-gray-400' : 'bg-white'} ${today ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  <div className="text-[10px] text-gray-500">{iso}</div>
                </div>
                <div className="mt-2 space-y-1">
                  {dayJobs.length === 0 && (
                    <div className="text-xs text-gray-400">No jobs</div>
                  )}
                  {dayJobs.map((j) => (
                    <div key={j.id} className="text-xs flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded ${j.status === 'completed' ? 'bg-green-100 text-green-700' : j.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{j.status === 'completed' ? 'Done' : j.status === 'scheduled' ? 'Sched' : 'Canceled'}</span>
                      <span className="text-gray-800">{j.time ? `${fmtTime(j.time)} ` : ''}{j.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Completed</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" /> Scheduled</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Canceled</span>
      </div>
    </div>
  )
}
