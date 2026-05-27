import { Activity, TrendingUp, Mountain, Clock } from 'lucide-react'

const MetricsCard = ({ label, value, unit, icon: Icon, color = 'text-accent-pace' }) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <span className="label-text">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="metric-value text-4xl text-text-primary">{value}</span>
        <span className="text-text-secondary text-sm font-mono">{unit}</span>
      </div>
    </div>
  )
}

export default MetricsCard
