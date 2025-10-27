export interface Property {
  id: number
  name: string
  location: string
  type: 'commercial' | 'residential'
  image: string
  price: number
  apy: number
  investors: number
  nav: number
  status: 'active' | 'pending' | 'closed'
  occupancy: number
}

export interface Vault {
  id: number
  name: string
  strategy: string
  tvl: number
  apy: number
  risk: 'low' | 'medium' | 'high'
  lockPeriod: string
  minInvest: number
  color: string
}

export interface Holding {
  name: string
  value: number
  apy: number
  allocation: number
}

export interface AIPrediction {
  title: string
  prediction: string
  confidence: number
  trend: 'up' | 'down' | 'neutral' | 'warning'
  factors: string[]
}
