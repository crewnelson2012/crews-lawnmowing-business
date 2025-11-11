import { useMemo } from 'react'
import { useStore } from '../store/store'

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

const fmtTime = (t?: string) => {
  if (!t) return ''
  const [hh, mm] = t.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mm} ${ampm}`
}

export default function TithingPage() {
  const jobs = useStore((s) => s.jobs)
  const clients = useStore((s) => s.clients)
  const toggleTithePaid = useStore((s) => s.toggleTithePaid)

  const paidJobs = useMemo(() => jobs.filter((j) => j.paid), [jobs])

  const allTimePaid = useMemo(() => sum(paidJobs.map((j) => j.amount)), [paidJobs])
  const tithePaidTotal = useMemo(() => sum(paidJobs.filter((j) => j.tithePaid).map((j) => j.amount * 0.1)), [paidJobs])
  const outstandingTithe = useMemo(() => sum(paidJobs.filter((j) => !j.tithePaid).map((j) => j.amount * 0.1)), [paidJobs])
  const netAfterTithePaid = useMemo(() => allTimePaid - tithePaidTotal, [allTimePaid, tithePaidTotal])

  const ledger = useMemo(() => {
    return paidJobs
      .map((j) => ({
        id: j.id,
        iso: `${j.date}T${j.time ?? '00:00'}`,
        date: j.date,
        time: j.time,
        amount: j.amount,
        tithe: j.amount * 0.1,
        tithePaid: !!j.tithePaid,
        client: clients.find((c) => c.id === j.clientId)?.name || 'Unknown',
      }))
      .sort((a, b) => a.iso.localeCompare(b.iso))
  }, [paidJobs, clients])

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Tithing</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">All-time earned (gross)</div>
          <div className="text-3xl font-semibold">${allTimePaid.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Outstanding tithing (10%)</div>
          <div className="text-3xl font-semibold">${outstandingTithe.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Net after tithing paid</div>
          <div className="text-3xl font-semibold">${netAfterTithePaid.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Tithe paid so far</div>
          <div className="text-3xl font-semibold">${tithePaidTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Client</th>
              <th className="p-3">Job amount</th>
              <th className="p-3">Tithe (10%)</th>
              <th className="p-3">Tithe paid</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-sm">{r.date}{r.time ? ` ${fmtTime(r.time)}` : ''}</td>
                <td className="p-3 text-sm">{r.client}</td>
                <td className="p-3">${r.amount.toFixed(2)}</td>
                <td className="p-3 font-medium ${r.tithePaid ? 'text-gray-400 line-through' : 'text-green-700'}">${r.tithe.toFixed(2)}</td>
                <td className="p-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={r.tithePaid} onChange={() => toggleTithePaid(r.id)} />
                    Paid
                  </label>
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>No paid jobs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
