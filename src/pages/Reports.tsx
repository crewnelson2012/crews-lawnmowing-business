import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import { addDays, addMonths, format, parseISO } from 'date-fns'

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

export default function Reports() {
  const jobs = useStore((s) => s.jobs)
  const [start, setStart] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
  const [end, setEnd] = useState<string>(new Date().toISOString().slice(0, 10))
  const [granularity, setGranularity] = useState<'day' | 'month' | 'year'>('day')

  const filtered = useMemo(() => jobs.filter((j) => j.status === 'completed' && j.date >= start && j.date <= end), [jobs, start, end])
  const scheduledInRange = useMemo(() => jobs.filter((j) => j.status === 'scheduled' && j.date >= start && j.date <= end), [jobs, start, end])

  const byDate = useMemo(() => {
    const map = new Map<string, { total: number; count: number; paid: number }>()
    for (const j of filtered) {
      const key = j.date
      const entry = map.get(key) || { total: 0, count: 0, paid: 0 }
      entry.total += j.amount
      entry.count += 1
      entry.paid += j.paid ? j.amount : 0
      map.set(key, entry)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const total = useMemo(() => sum(filtered.map((j) => j.amount)), [filtered])
  const paid = useMemo(() => sum(filtered.filter((j) => j.paid).map((j) => j.amount)), [filtered])
  const allTimePaid = useMemo(() => sum(jobs.filter((j) => j.paid).map((j) => j.amount)), [jobs])
  const scheduledTotal = useMemo(() => sum(scheduledInRange.map((j) => j.amount)), [scheduledInRange])

  const bucketKey = (isoDate: string) => {
    if (granularity === 'year') return isoDate.slice(0, 4)
    if (granularity === 'month') return isoDate.slice(0, 7) // YYYY-MM
    return isoDate // day
  }

  const completedByBucket = useMemo(() => {
    const map = new Map<string, number>()
    for (const j of filtered) {
      const k = bucketKey(j.date)
      map.set(k, (map.get(k) || 0) + j.amount)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, granularity])

  const scheduledByBucket = useMemo(() => {
    const map = new Map<string, number>()
    for (const j of scheduledInRange) {
      const k = bucketKey(j.date)
      map.set(k, (map.get(k) || 0) + j.amount)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [scheduledInRange, granularity])

  // Forecast: next 30 days (by day)
  const forecastDays = useMemo(() => {
    const startDate = new Date()
    const endDate = addDays(startDate, 30)
    const startISO = startDate.toISOString().slice(0, 10)
    const endISO = endDate.toISOString().slice(0, 10)
    const map = new Map<string, number>()
    // initialize each day to 0
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      map.set(d.toISOString().slice(0, 10), 0)
    }
    for (const j of jobs) {
      if (j.status === 'scheduled' && j.date >= startISO && j.date <= endISO) {
        map.set(j.date, (map.get(j.date) || 0) + j.amount)
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [jobs])

  // Forecast: next 12 months (by month)
  const forecastMonths = useMemo(() => {
    const now = new Date()
    const labels: string[] = [] // YYYY-MM
    for (let i = 0; i < 12; i++) {
      labels.push(addMonths(now, i).toISOString().slice(0, 7))
    }
    const map = new Map<string, number>()
    for (const l of labels) map.set(l, 0)
    for (const j of jobs) {
      if (j.status === 'scheduled' && j.date >= labels[0] + '-01' && j.date.slice(0, 7) <= labels[labels.length - 1]) {
        const key = j.date.slice(0, 7)
        if (map.has(key)) map.set(key, (map.get(key) || 0) + j.amount)
      }
    }
    return labels.map((l) => [l, map.get(l) || 0] as const)
  }, [jobs])

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600">Start</label>
          <input type="date" className="border rounded-md px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">End</label>
          <input type="date" className="border rounded-md px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="ml-auto flex items-end gap-1">
          <span className="text-sm text-gray-600 mr-2">View</span>
          <button className={`px-3 py-1.5 rounded-md text-sm border ${granularity === 'day' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setGranularity('day')}>Day</button>
          <button className={`px-3 py-1.5 rounded-md text-sm border ${granularity === 'month' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setGranularity('month')}>Month</button>
          <button className={`px-3 py-1.5 rounded-md text-sm border ${granularity === 'year' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setGranularity('year')}>Year</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Completed total</div>
          <div className="text-3xl font-semibold">${total.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-3xl font-semibold">${paid.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Unpaid</div>
          <div className="text-3xl font-semibold">${(total - paid).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Estimated (scheduled)</div>
          <div className="text-3xl font-semibold">${scheduledTotal.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">All-time earned</div>
          <div className="text-3xl font-semibold">${allTimePaid.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Completed by {granularity}</div>
            <div className="text-xs text-gray-500">${sum(completedByBucket.map(([, v]) => v)).toFixed(2)}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(() => {
              const max = Math.max(0, ...completedByBucket.map(([, v]) => v))
              return completedByBucket.map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">${value.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded">
                    <div className="h-2.5 bg-brand-500 rounded" style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))
            })()}
            {completedByBucket.length === 0 && (
              <div className="text-sm text-gray-500">No completed jobs in this range.</div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Estimated (scheduled) by {granularity}</div>
            <div className="text-xs text-gray-500">${sum(scheduledByBucket.map(([, v]) => v)).toFixed(2)}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(() => {
              const max = Math.max(0, ...scheduledByBucket.map(([, v]) => v))
              return scheduledByBucket.map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">${value.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded">
                    <div className="h-2.5 bg-yellow-500 rounded" style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))
            })()}
            {scheduledByBucket.length === 0 && (
              <div className="text-sm text-gray-500">No scheduled jobs in this range.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Jobs</th>
              <th className="p-3">Completed</th>
              <th className="p-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {byDate.map(([date, d]) => (
              <tr key={date} className="border-t">
                <td className="p-3">{date}</td>
                <td className="p-3">{d.count}</td>
                <td className="p-3">${d.total.toFixed(2)}</td>
                <td className="p-3">${d.paid.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Estimated next 30 days (by day)</div>
            <div className="text-xs text-gray-500">${sum(forecastDays.map(([, v]) => v)).toFixed(2)}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(() => {
              const max = Math.max(0, ...forecastDays.map(([, v]) => v))
              return forecastDays.map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">${value.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded">
                    <div className="h-2.5 bg-brand-600 rounded" style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))
            })()}
            {forecastDays.length === 0 && (
              <div className="text-sm text-gray-500">No scheduled jobs in the next 30 days.</div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Estimated next 12 months (by month)</div>
            <div className="text-xs text-gray-500">${sum(forecastMonths.map(([, v]) => v)).toFixed(2)}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(() => {
              const max = Math.max(0, ...forecastMonths.map(([, v]) => v))
              return forecastMonths.map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">${value.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded">
                    <div className="h-2.5 bg-brand-600 rounded" style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))
            })()}
            {forecastMonths.length === 0 && (
              <div className="text-sm text-gray-500">No scheduled jobs in the next 12 months.</div>
            )}
          </div>
          <div className="mt-3 text-sm font-medium">Total: ${sum(forecastMonths.map(([, v]) => v)).toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
