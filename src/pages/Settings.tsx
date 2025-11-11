import { useRef, useState, type ChangeEvent } from 'react'
import { useStore } from '../store/store'

export default function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const reset = useStore((s) => s.reset)
  const inputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState<string>('')

  const onExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lawnmower-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    importData(data)
    setSaved('Data imported')
    setTimeout(() => setSaved(''), 2000)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-4">
        <div className="text-lg font-semibold">Preferences</div>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Jobs per day</label>
          <input type="number" className="border rounded-md px-3 py-2 w-28" value={settings.dailyLimit} onChange={(e) => updateSettings({ dailyLimit: Number(e.target.value) })} />
          {saved && <span className="text-sm text-green-600">{saved}</span>}
        </div>
        <div className="mt-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!settings.saturdayOnly} onChange={(e) => updateSettings({ saturdayOnly: e.target.checked })} />
            Saturday-only scheduling
          </label>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="text-lg font-semibold">Data</div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md bg-brand-600 text-white" onClick={onExport}>Export JSON</button>
          <label className="px-4 py-2 rounded-md border cursor-pointer">
            <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
            Import JSON
          </label>
          <button className="px-4 py-2 rounded-md border text-red-600" onClick={() => { if (confirm('Clear all data?')) reset() }}>Reset</button>
        </div>
      </div>
    </div>
  )
}
