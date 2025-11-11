import { useState, type FormEvent } from 'react'
import { formatISO, nextSaturday } from 'date-fns'
import { useStore } from '../store/store'
import type { Client } from '../store/types'

const fmtTime = (t?: string) => {
  if (!t) return ''
  const [hh, mm] = t.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mm} ${ampm}`
}

export default function Clients() {
  const clients = useStore((s) => s.clients)
  const jobs = useStore((s) => s.jobs)
  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const deleteClient = useStore((s) => s.deleteClient)
  const bulkAddWeekly = useStore((s) => s.bulkAddWeekly)
  const saturdayOnly = useStore((s) => s.settings.saturdayOnly)

  const [form, setForm] = useState<Partial<Client>>({ name: '', address: '', phone: '', pricePerMow: 40, notes: '', active: true, frequency: 'one_time' })
  const [startDate, setStartDate] = useState<string>(formatISO(saturdayOnly ? nextSaturday(new Date()) : new Date(), { representation: 'date' }))
  const [defaultTime, setDefaultTime] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name || form.pricePerMow == null) return
    if (editingId) {
      updateClient(editingId, {
        name: form.name,
        address: form.address,
        phone: form.phone,
        notes: form.notes,
        pricePerMow: Number(form.pricePerMow),
        active: form.active ?? true,
        frequency: (form.frequency as any) ?? 'one_time',
        defaultTime: defaultTime || undefined
      })
    } else {
      const client = addClient({
        name: form.name,
        address: form.address,
        phone: form.phone,
        notes: form.notes,
        pricePerMow: Number(form.pricePerMow),
        active: form.active ?? true,
        frequency: (form.frequency as any) ?? 'one_time',
        defaultTime: defaultTime || undefined
      })
      if ((form.frequency as any) === 'weekly' && startDate) {
        bulkAddWeekly(client.id, startDate, defaultTime || undefined)
      }
    }
    setForm({ name: '', address: '', phone: '', pricePerMow: 40, notes: '', active: true, frequency: 'one_time' })
    setStartDate(formatISO(saturdayOnly ? nextSaturday(new Date()) : new Date(), { representation: 'date' }))
    setDefaultTime('')
    setEditingId(null)
  }

  const startEdit = (c: Client) => {
    setEditingId(c.id)
    setForm({ ...c })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 space-y-3">
          <div className="text-lg font-semibold">{editingId ? 'Edit client' : 'Add client'}</div>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Address" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input type="number" className="w-full border rounded-md px-3 py-2" placeholder="Price per mow" value={form.pricePerMow ?? 0} onChange={(e) => setForm({ ...form, pricePerMow: Number(e.target.value) })} />
          <textarea className="w-full border rounded-md px-3 py-2" placeholder="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div>
            <label className="block text-sm text-gray-600">Frequency</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.frequency || 'one_time'} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}>
              <option value="one_time">One-time</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {form.frequency === 'weekly' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600">{saturdayOnly ? 'Start Saturday' : 'Start date'}</label>
                <input type="date" className="w-full border rounded-md px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Default time</label>
                <input type="time" className="w-full border rounded-md px-3 py-2" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-600 text-white">{editingId ? 'Save' : 'Add'}</button>
            {editingId && (
              <button type="button" className="px-3 py-2 rounded-md border" onClick={() => { setEditingId(null); setForm({ name: '', address: '', phone: '', pricePerMow: 40, notes: '', active: true, frequency: 'one_time' }); setStartDate(formatISO(saturdayOnly ? nextSaturday(new Date()) : new Date(), { representation: 'date' })); setDefaultTime('') }}>Cancel</button>
            )}
          </div>
        </form>
      </div>
      <div className="md:col-span-2">
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Price</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Active</th>
                <th className="p-3">Last mowed</th>
                <th className="p-3">Next scheduled</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.address}</div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.notes}</div>
                  </td>
                  <td className="p-3">${c.pricePerMow.toFixed(2)}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.active ? 'Yes' : 'No'}</td>
                  <td className="p-3 align-top">
                    {(() => {
                      const completed = jobs
                        .filter((j) => j.clientId === c.id && j.status === 'completed')
                        .map((j) => ({ iso: `${j.date}T${j.time ?? '00:00'}`, label: `${j.date}${j.time ? ` ${fmtTime(j.time)}` : ''}` }))
                      if (completed.length === 0) return <span className="text-xs text-gray-500">-</span>
                      const last = completed.sort((a, b) => a.iso.localeCompare(b.iso))[completed.length - 1].label
                      return <span className="text-xs text-gray-700">{last}</span>
                    })()}
                  </td>
                  <td className="p-3 align-top">
                    {(() => {
                      const today = new Date().toISOString().slice(0, 10)
                      const sched = jobs
                        .filter((j) => j.clientId === c.id && j.status === 'scheduled' && j.date >= today)
                        .map((j) => ({ iso: `${j.date}T${j.time ?? '00:00'}`, label: `${j.date}${j.time ? ` ${fmtTime(j.time)}` : ''}` }))
                      if (sched.length === 0) return <span className="text-xs text-gray-500">-</span>
                      const next = sched.sort((a, b) => a.iso.localeCompare(b.iso))[0].label
                      return <span className="text-xs text-gray-700">{next}</span>
                    })()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <button className="px-3 py-1 rounded-md border" onClick={() => startEdit(c)}>Edit</button>
                      <button className="px-3 py-1 rounded-md border text-red-600" onClick={() => { if (confirm('Delete client and their jobs?')) deleteClient(c.id) }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
