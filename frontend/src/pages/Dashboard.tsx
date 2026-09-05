import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Inbox, Brain, AlertTriangle, Clock, BookOpen,
  ArrowRight, Sparkles, CheckCircle
} from 'lucide-react'
import { getDashboard, getCases } from '../services/api'
import { KPICard, DecisionBadge, PriorityBadge, LoadingState, ConfidenceMeter } from '../components/ui'
import type { DemoCase } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<any>(null)
  const [cases, setCases] = useState<DemoCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getCases()])
      .then(([d, c]) => {
        setDashboard(d)
        setCases(c as DemoCase[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading dashboard..." />

  const kpis = dashboard?.kpis || {}

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">{dashboard?.greeting || 'Good afternoon, Agent'}</h1>
          <p className="text-surface-500 mt-1">{dashboard?.subtitle || "Here's what needs your attention."}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cases')} className="btn-primary">
            <Inbox className="w-4 h-4" />
            Open Resolution Workspace
          </button>
          <button onClick={() => navigate('/cases')} className="btn-secondary">
            Explore Demo Cases
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Open Cases" value={kpis.open_cases || 128} icon={Inbox} color="brand" delay={0.05} />
        <KPICard title="AI Ready" value={kpis.ai_ready || 74} icon={Brain} color="emerald" delay={0.1} />
        <KPICard title="Needs Information" value={kpis.needs_information || 21} icon={Clock} color="amber" delay={0.15} />
        <KPICard title="Escalations" value={kpis.escalations || 13} icon={AlertTriangle} color="red" delay={0.2} />
        <KPICard title="Knowledge Coverage" value={kpis.knowledge_coverage_pct || 92} unit="%" icon={BookOpen} color="sky" delay={0.25} />
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Resolution Queue</h2>
              <p className="text-xs text-surface-500">Active demo scenarios ready for analysis</p>
            </div>
            <button onClick={() => navigate('/cases')} className="btn-secondary text-xs py-1.5">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {cases.slice(0, 5).map((c, i) => (
              <motion.div
                key={c.case_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                onClick={() => navigate(`/cases/${c.case_id}`)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-700/30 hover:bg-dark-hover transition-all cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-surface-500">{c.case_id}</span>
                    <span className="text-xs text-surface-600">•</span>
                    <span className="text-xs font-medium text-white truncate">{c.customer_name || 'Customer'}</span>
                  </div>
                  <p className="text-xs text-surface-400 truncate">{c.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={c.priority} />
                  <DecisionBadge decision={c.expected_decision} />
                  <div className="w-16">
                    <ConfidenceMeter value={c.ai_confidence / 100} />
                  </div>
                  <ArrowRight className="w-3 h-3 text-surface-600 group-hover:text-brand-400 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Boundary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 space-y-4"
        >
          <div>
            <h2 className="text-sm font-semibold text-white">AI vs Human Boundary</h2>
            <p className="text-xs text-surface-500 mt-0.5">Clear separation of responsibilities</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> AI CAN
              </p>
              {['Retrieve evidence', 'Summarize conversation', 'Draft routine resolutions', 'Identify missing info', 'Prepare escalation handoff'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-surface-400 py-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> HUMAN DECIDES
              </p>
              {['Complex cases', 'Unsupported cases', 'Conflicting information', 'Policy exceptions', 'Final approval before sending'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-surface-400 py-0.5">
                  <CheckCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Demo label */}
      <div className="flex items-center justify-center">
        <span className="text-xs text-surface-600 bg-dark-card border border-dark-border px-3 py-1 rounded-full">
          ⚡ Synthetic demo data — NexusTiQ 24 Hackathon • PS04
        </span>
      </div>
    </div>
  )
}
