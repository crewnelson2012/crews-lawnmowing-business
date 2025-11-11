import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../store/store'
import { addDays, formatISO, nextSaturday } from 'date-fns'

export default function Dashboard() {
  const clients = useStore((s) => s.clients)
  const jobs = useStore((s) => s.jobs)
  const upcomingDate = useMemo(() => formatISO(nextSaturday(new Date()), { representation: 'date' }), [])
  const upcomingCount = useMemo(() => jobs.filter((j) => j.date === upcomingDate).length, [jobs, upcomingDate])
  const totalPaid = useMemo(() => jobs.filter((j) => j.paid).reduce((a, b) => a + b.amount, 0), [jobs])
  const unpaid = useMemo(
    () => jobs.filter((j) => j.status === 'completed' && !j.paid).reduce((a, b) => a + b.amount, 0),
    [jobs]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total earned</div>
          <div className="text-3xl font-semibold">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Unpaid</div>
          <div className="text-3xl font-semibold">${unpaid.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Clients</div>
          <div className="text-3xl font-semibold">{clients.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Next Saturday</div>
          <div className="text-xl font-semibold">{upcomingDate}</div>
          <div className="text-sm text-gray-600">{upcomingCount} scheduled</div>
        </div>
        <div className="flex gap-3">
          <Link to="/clients" className="px-4 py-2 rounded-md bg-gray-900 text-white">Add client</Link>
          <Link to="/schedule" className="px-4 py-2 rounded-md bg-brand-600 text-white">Plan schedule</Link>
        </div>
      </div>
    </div>
  )
}
