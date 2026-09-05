import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'
import { getAnalytics } from '../services/api'
import { KPICard, LoadingState } from '../components/ui'
import {
  Inbox, Brain, AlertTriangle, Clock, TrendingUp, BookOpen, Zap, CheckCircle
} from 'lucide-react'

const CHART_COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#e879f9', '#fb923c']

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading analytics..." />
  if (!data) return null

  const kpis = data.kpis || {}

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-surface-500 mt-0.5">Performance insights — demo data</p>
        </div>
        <span className="text-xs text-surface-600 bg-dark-card border border-dark-border px-3 py-1 rounded-full">
          ⚡ Illustrative KPIs — synthetic demo data
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Open Cases" value={kpis.open_cases} icon={Inbox} color="brand" delay={0.05} />
        <KPICard title="AI Ready" value={kpis.ai_ready} icon={Brain} color="emerald" delay={0.1} />
        <KPICard title="Escalations" value={kpis.escalations} icon={AlertTriangle} color="red" delay={0.15} />
        <KPICard title="KB Coverage" value={kpis.knowledge_coverage_pct} unit="%" icon={BookOpen} color="sky" delay={0.2} />
        <KPICard title="Avg Resolution" value={kpis.avg_resolution_time_min} unit="min" icon={Clock} color="amber" delay={0.25} />
        <KPICard title="Resolution Rate" value={kpis.resolution_rate_pct} unit="%" icon={CheckCircle} color="emerald" delay={0.3} change={3.2} />
        <KPICard title="AI Ready Rate" value={kpis.ai_ready_rate_pct} unit="%" icon={Zap} color="brand" delay={0.35} />
        <KPICard title="Escalation Rate" value={kpis.escalation_rate_pct} unit="%" icon={TrendingUp} color="red" delay={0.4} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Resolution Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weekly_trend || []} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#72748a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#72748a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111119', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="resolved" fill="#34d399" name="Resolved" radius={[3,3,0,0]} />
              <Bar dataKey="escalated" fill="#f87171" name="Escalated" radius={[3,3,0,0]} />
              <Bar dataKey="pending" fill="#818cf8" name="Pending" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Case Categories</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data.category_breakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
              >
                {(data.category_breakdown || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111119', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {(data.category_breakdown || []).map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-surface-400">{cat.name}</span>
                </div>
                <span className="text-white font-medium">{cat.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confidence distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">AI Confidence Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.confidence_distribution || {}).map(([label, count]: any, i) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-surface-400">{label}</span>
                  <span className="text-white font-medium">{count} cases</span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: CHART_COLORS[i] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / 8) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Escalation reasons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Escalation Reasons</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.escalation_reasons || []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#72748a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="reason" type="category" tick={{ fill: '#a0a0b0', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#111119', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#f87171" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
