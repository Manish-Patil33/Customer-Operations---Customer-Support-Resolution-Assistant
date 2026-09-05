import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { getCases } from '../services/api'
import { DecisionBadge, PriorityBadge, ConfidenceMeter, LoadingState, EmptyState } from '../components/ui'
import type { DemoCase } from '../types'
import clsx from 'clsx'

const CATEGORY_FILTERS = ['All', 'Billing', 'Broadband', 'Mobile', 'Plan', 'Account', 'Other']

export default function CaseInbox() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<DemoCase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    getCases()
      .then(data => setCases(data as DemoCase[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = cases.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_id.toLowerCase().includes(search.toLowerCase()) ||
      (c.customer_name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || c.category.toLowerCase() === category.toLowerCase()
    return matchSearch && matchCat
  })

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Case Inbox</h1>
          <p className="text-sm text-surface-500 mt-0.5">{cases.length} active cases — {cases.filter(c => c.expected_decision === 'RESOLVE').length} AI ready</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            className="input pl-9"
            placeholder="Search cases, customers, issues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-dark-hover border border-transparent hover:border-dark-border'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cases table */}
      {loading ? (
        <LoadingState message="Loading cases..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="No cases found" description="Try adjusting your filters" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Case ID', 'Customer', 'Issue', 'Category', 'Priority', 'AI Confidence', 'Decision', 'Scenario'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-surface-500 whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.case_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/cases/${c.case_id}`)}
                  className="border-b border-dark-border/50 hover:bg-dark-hover cursor-pointer group transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-brand-400">{c.case_id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-white text-xs">{c.customer_name || c.customer_id}</div>
                    <div className="text-surface-500 text-[10px]">{c.customer_plan || ''}</div>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-xs text-surface-300 truncate" title={c.title}>{c.title}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-surface-400 capitalize">{c.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3.5 w-32">
                    <ConfidenceMeter value={c.ai_confidence / 100} />
                  </td>
                  <td className="px-4 py-3.5">
                    <DecisionBadge decision={c.expected_decision} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] text-surface-500 bg-dark-bg border border-dark-border px-2 py-0.5 rounded-full">
                      {c.scenario_label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
