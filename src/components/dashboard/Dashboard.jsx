import { Activity, TrendingUp, Mountain, Clock } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import MetricsCard from './MetricsCard'

const mockData = [
  { km: 1, pace: 5.2, elevation: 45, hr: 142 },
  { km: 2, pace: 5.5, elevation: 120, hr: 155 },
  { km: 3, pace: 6.1, elevation: 180, hr: 168 },
  { km: 4, pace: 5.8, elevation: 95, hr: 162 },
  { km: 5, pace: 5.4, elevation: 60, hr: 158 },
  { km: 6, pace: 5.9, elevation: 140, hr: 165 },
  { km: 7, pace: 6.3, elevation: 200, hr: 172 },
  { km: 8, pace: 6.0, elevation: 110, hr: 168 },
  { km: 9, pace: 5.7, elevation: 85, hr: 163 },
  { km: 10, pace: 5.5, elevation: 70, hr: 160 },
  { km: 11, pace: 5.8, elevation: 125, hr: 166 },
  { km: 12, pace: 6.2, elevation: 175, hr: 170 },
  { km: 13, pace: 5.9, elevation: 105, hr: 165 },
  { km: 14, pace: 5.6, elevation: 80, hr: 161 },
  { km: 15, pace: 5.3, elevation: 55, hr: 157 },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-panel-bg border border-border-primary rounded-sm p-3">
        <p className="label-text mb-2">Km {payload[0].payload.km}</p>
        <div className="space-y-1">
          <p className="text-sm font-mono">
            <span className="text-accent-pace">Ritmo:</span> {payload[0].payload.pace} min/km
          </p>
          <p className="text-sm font-mono">
            <span className="text-accent-elevation">Desnivel:</span> {payload[0].payload.elevation}m
          </p>
          <p className="text-sm font-mono">
            <span className="text-accent-hr">FC:</span> {payload[0].payload.hr} bpm
          </p>
        </div>
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const totalDistance = 15.0
  const totalElevation = 1545
  const totalTime = 87
  const avgPace = 5.8

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tighter text-text-primary mb-2">
          Dashboard
        </h2>
        <p className="text-text-secondary text-sm">
          Análisis de actividades y métricas de rendimiento
        </p>
      </div>

      <div className="metrics-grid">
        <MetricsCard
          label="Distancia Total"
          value={totalDistance.toFixed(1)}
          unit="km"
          icon={Activity}
          color="text-accent-pace"
        />
        <MetricsCard
          label="Desnivel Acumulado"
          value={totalElevation}
          unit="m"
          icon={Mountain}
          color="text-accent-elevation"
        />
        <MetricsCard
          label="Tiempo Total"
          value={totalTime}
          unit="min"
          icon={Clock}
          color="text-text-secondary"
        />
        <MetricsCard
          label="Ritmo Promedio"
          value={avgPace.toFixed(1)}
          unit="min/km"
          icon={TrendingUp}
          color="text-accent-hr"
        />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold tracking-tighter text-text-primary mb-4">
          Análisis por Kilómetro
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockData}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
                dataKey="km"
                stroke="#8B92A5"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                label={{ value: 'Kilómetro', position: 'insideBottom', offset: -5, fill: '#8B92A5' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#8B92A5"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                label={{ value: 'Ritmo (min/km)', angle: -90, position: 'insideLeft', fill: '#8B92A5' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#8B92A5"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                label={{ value: 'Desnivel (m)', angle: 90, position: 'insideRight', fill: '#8B92A5' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="right"
                dataKey="elevation"
                fill="#B5FF3A"
                radius={[0, 0, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pace"
                stroke="#00E5FF"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
