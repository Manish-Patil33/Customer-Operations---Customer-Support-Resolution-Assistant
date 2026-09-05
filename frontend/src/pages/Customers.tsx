import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search } from 'lucide-react'
import { getCustomers } from '../services/api'
import { LoadingState, EmptyState } from '../components/ui'
import type { Customer } from '../types'
import clsx from 'clsx'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCustomers()
      .then(data => setCustomers(data as Customer[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id.toLowerCase().includes(search.toLowerCase()) ||
    c.plan.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingState message="Loading customers..." />

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customer Directory</h1>
          <p className="text-sm text-surface-500 mt-0.5">{customers.length} synthetic customers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input className="input pl-9 w-64" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div
            key={c.customer_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card p-4 card-hover space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{c.name}</p>
                <p className="text-xs font-mono text-surface-500">{c.customer_id}</p>
              </div>
              <span className={clsx(
                'badge text-[10px]',
                c.service_status === 'active' ? 'badge-ai-ready' :
                c.service_status === 'suspended' ? 'badge-escalate' : 'badge-needs-info'
              )}>
                {c.service_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-surface-600">Plan</p>
                <p className="text-white">{c.plan}</p>
              </div>
              <div>
                <p className="text-surface-600">Type</p>
                <p className="text-white capitalize">{c.service_type}</p>
              </div>
              <div>
                <p className="text-surface-600">Current Bill</p>
                <p className={clsx('font-medium', c.current_bill > c.previous_bill ? 'text-amber-400' : 'text-white')}>
                  ₹{c.current_bill}
                </p>
              </div>
              <div>
                <p className="text-surface-600">Billing</p>
                <span className={clsx('badge text-[10px]',
                  c.billing_status === 'paid' ? 'badge-ai-ready' :
                  c.billing_status === 'overdue' ? 'badge-escalate' : 'badge-needs-info'
                )}>
                  {c.billing_status}
                </span>
              </div>
            </div>

            {c.account_notes && (
              <div className="p-2 rounded bg-dark-bg border border-amber-500/20 text-xs text-amber-300 truncate">
                {c.account_notes.substring(0, 80)}...
              </div>
            )}

            <div className="text-xs text-surface-600">
              {c.recent_ticket_ids.length} recent ticket{c.recent_ticket_ids.length !== 1 ? 's' : ''}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon={Users} title="No customers found" />}
    </div>
  )
}
