import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getEscalations } from '../services/api'
import { PriorityBadge, ConfidenceMeter, LoadingState, EmptyState } from '../components/ui'

export default function Escalations() {
  const navigate = useNavigate()
  const [escalations, setEscalations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEscalations()
      .then(data => setEscalations(data as any[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading escalations..." />

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Escalation Queue</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {escalations.length} cases requiring human review
          </p>
        </div>
      </div>

      <div className="card p-3 border border-amber-500/15 bg-amber-500/5">
        <p className="text-xs text-amber-400">
          <strong>Why are these escalated?</strong> ResolveIQ escalates when: knowledge coverage is insufficient,
          contradictions exist between sources, the case is outside the supported knowledge domain,
          or the case complexity exceeds AI authority. Human review is required.
        </p>
      </div>

      {escalations.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No escalations" description="All cases are within AI resolution capacity" />
      ) : (
        <div className="space-y-3">
          {escalations.map((e, i) => (
            <motion.div
              key={e.case_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/cases/${e.case_id}`)}
              className="card p-4 card-hover cursor-pointer group border border-red-500/10 hover:border-red-500/25"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-brand-400">{e.case_id}</span>
                    <PriorityBadge priority={e.priority} />
                    <span className="text-xs text-surface-600 bg-dark-bg border border-dark-border px-2 py-0.5 rounded-full">
                      {e.scenario_label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{e.title}</p>
                  <p className="text-xs text-surface-500 mt-1">{e.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-surface-600">Customer</p>
                    <p className="text-xs font-medium text-white">{e.customer_name}</p>
                    <p className="text-xs text-surface-500">{e.customer_plan}</p>
                  </div>
                  <div className="w-24">
                    <p className="text-[10px] text-surface-600 mb-1">AI Confidence</p>
                    <ConfidenceMeter value={(e.ai_confidence || 0) / 100} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
