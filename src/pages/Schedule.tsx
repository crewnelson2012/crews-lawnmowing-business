import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import { format, formatISO, isSaturday, nextSaturday, parseISO } from 'date-fns'

const fmtTime = (t?: string) => {
  if (!t) return ''
  const [hh, mm] = t.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mm} ${ampm}`
}

export default function Schedule() {
  const clients = useStore((s) => s.clients)
  const addJob = useStore((s) => s.addJob)
  const getDayJobs = useStore((s) => s.getDayJobs)
  const setJobStatus = useStore((s) => s.setJobStatus)
  const toggleJobPaid = useStore((s) => s.toggleJobPaid)
  const setJobAmount = useStore((s) => s.setJobAmount)
  const setJobTime = useStore((s) => s.setJobTime)
  const allJobs = useStore((s) => s.jobs)
  const deleteJob = useStore((s) => s.deleteJob)
  const limit = useStore((s) => s.settings.dailyLimit)
  const saturdayOnly = useStore((s) => s.settings.saturdayOnly)

  const initial = useMemo(() => saturdayOnly ? formatISO(nextSaturday(new Date()), { representation: 'date' }) : new Date().toISOString().slice(0, 10), [saturdayOnly])
  const [dateISO, setDateISO] = useState(initial)
  const [clientId, setClientId] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [showAllDates, setShowAllDates] = useState<boolean>(false)

  const jobs = getDayJobs(dateISO)
  const canSchedule = (!saturdayOnly || isSaturday(parseISO(dateISO))) && jobs.length < limit

  const onAdd = () => {
    if (!clientId) return
    const res = addJob(dateISO, clientId, time || undefined)
    if ('error' in res) setMessage(res.error)
    else setMessage('')
    setClientId('')
    setTime('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600">Date</label>
          <input type="date" className="border rounded-md px-3 py-2" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Client</label>
          <select className="border rounded-md px-3 py-2 min-w-64" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {clients.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.id}>{c.name} (${c.pricePerMow.toFixed(2)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Time</label>
          <input type="time" className="border rounded-md px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button onClick={onAdd} disabled={!canSchedule || !clientId} className={`px-4 py-2 rounded-md ${canSchedule && clientId ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Add to schedule</button>
        <div className="text-sm text-gray-600">{saturdayOnly && !isSaturday(parseISO(dateISO)) ? 'Only Saturdays are allowed' : jobs.length >= limit ? `Daily limit of ${limit} reached` : ''}</div>
        {message && <div className="text-sm text-red-600">{message}</div>}

        {clientId && (
          <div className="w-full pt-2 text-sm text-gray-700 space-y-1">
            {(() => {
              const clientJobs = allJobs.filter((j) => j.clientId === clientId)
              const completed = clientJobs
                .filter((j) => j.status === 'completed')
                .map((j) => ({ iso: `${j.date}T${j.time ?? '00:00'}`, label: `${j.date}${j.time ? ` ${fmtTime(j.time)}` : ''}` }))
                .sort((a, b) => a.iso.localeCompare(b.iso))
              const lastMowed = completed.length ? completed[completed.length - 1].label : null

              const today = new Date().toISOString().slice(0, 10)
              const scheduled = clientJobs
                .filter((j) => j.status === 'scheduled' && j.date >= today)
                .map((j) => ({ iso: `${j.date}T${j.time ?? '00:00'}`, label: `${j.date}${j.time ? ` ${fmtTime(j.time)}` : ''}` }))
                .sort((a, b) => a.iso.localeCompare(b.iso))
              const nextSched = scheduled.length ? scheduled[0].label : null

              return (
                <div>
                  <div>Last mowed: <span className="text-gray-800">{lastMowed ?? '-'}</span></div>
                  <div>Next scheduled: <span className="text-gray-800">{nextSched ?? '-'}</span></div>
                </div>
              )
            })()}
            <div className="pt-1">
              <button type="button" className="text-brand-600 text-xs underline" onClick={() => setShowAllDates((s) => !s)}>
                {showAllDates ? 'Hide' : 'Show'} all dates
              </button>
            </div>
            {showAllDates && (
              <div className="text-xs text-gray-700">
                {(() => {
                  const view = allJobs
                    .filter((j) => j.clientId === clientId && j.status !== 'canceled')
                    .map((j) => ({
                      key: j.id,
                      iso: `${j.date}T${j.time ?? '00:00'}`,
                      label: `${j.date}${j.time ? ` ${fmtTime(j.time)}` : ''}`,
                      status: j.status
                    }))
                    .sort((a, b) => a.iso.localeCompare(b.iso))
                  if (view.length === 0) return <div>-</div>
                  return (
                    <ul className="list-disc ml-5 space-y-0.5">
                      {view.map((v) => (
                        <li key={v.key}>
                          <span className="font-medium">{v.label}</span>{' '}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] align-middle ${v.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {v.status === 'completed' ? 'Completed' : 'Scheduled'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Time</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Paid</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const client = clients.find((c) => c.id === j.clientId)
              return (
                <tr key={j.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{client?.name}</div>
                    <div className="text-xs text-gray-500">{client?.address}</div>
                    {client?.notes && <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">Notes: {client.notes}</div>}
                  </td>
                  <td className="p-3">
                    <input type="time" className="w-32 border rounded-md px-2 py-1" value={j.time || ''} onChange={(e) => setJobTime(j.id, e.target.value || undefined)} />
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-28 border rounded-md px-2 py-1" value={j.amount} onChange={(e) => setJobAmount(j.id, Number(e.target.value))} />
                  </td>
                  <td className="p-3">
                    <select className="border rounded-md px-2 py-1" value={j.status} onChange={(e) => setJobStatus(j.id, e.target.value as any)}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={j.paid} onChange={() => toggleJobPaid(j.id)} /> Paid</label>
                  </td>
                  <td className="p-3 text-right">
                    <button className="px-3 py-1 rounded-md border text-red-600" onClick={() => deleteJob(j.id)}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
