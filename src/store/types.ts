export type Client = {
  id: string
  name: string
  address?: string
  phone?: string
  pricePerMow: number
  notes?: string
  active: boolean
  frequency?: 'one_time' | 'weekly'
  defaultTime?: string
  createdAt: string
}

export type JobStatus = 'scheduled' | 'completed' | 'canceled'

export type Job = {
  id: string
  clientId: string
  date: string
  time?: string
  status: JobStatus
  amount: number
  paid: boolean
  paidAt?: string
  tithePaid?: boolean
  tithePaidAt?: string
  createdAt: string
}

export type Settings = {
  dailyLimit: number
  saturdayOnly: boolean
}

export type DataExport = {
  clients: Client[]
  jobs: Job[]
  settings: Settings
}
