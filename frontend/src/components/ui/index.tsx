// Shared UI Components

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Badge ──────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'ai-ready' | 'needs-info' | 'escalate' | 'resolved' | 'knowledge' | 'account' | 'conversation' | 'default'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    'ai-ready': 'badge-ai-ready',
    'needs-info': 'badge-needs-info',
    'escalate': 'badge-escalate',
    'resolved': 'badge-resolved',
    'knowledge': 'badge-knowledge',
    'account': 'badge-account',
    'conversation': 'badge-conversation',
    'default': 'bg-surface-800 text-surface-300 border border-surface-700',
  }
  return (
    <span className={clsx('badge', variantClasses[variant], className)}>
      {children}
    </span>
  )
}

// ── Decision Badge ─────────────────────────────────────────────
export function DecisionBadge({ decision }: { decision: string }) {
  if (decision === 'RESOLVE') return <Badge variant="ai-ready">AI READY</Badge>
  if (decision === 'ASK_INFORMATION') return <Badge variant="needs-info">NEEDS INFO</Badge>
  if (decision === 'ESCALATE') return <Badge variant="escalate">ESCALATE</Badge>
  return <Badge>{decision}</Badge>
}

// ── Priority Badge ─────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: string }) {
  const classes: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border border-red-500/20',
    high: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    low: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  }
  return (
    <span className={clsx('badge', classes[priority] || classes.medium)}>
      {priority}
    </span>
  )
}

// ── Confidence Meter ───────────────────────────────────────────
export function ConfidenceMeter({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100)
  const colorClass = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textClass = pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-bg rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className={clsx('text-xs font-mono font-semibold w-9', textClass)}>{pct}%</span>
      {label && <span className="text-xs text-surface-500">{label}</span>}
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────
interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  icon: React.ElementType
  color?: string
  delay?: number
}

export function KPICard({ title, value, unit, change, icon: Icon, color = 'brand', delay = 0 }: KPICardProps) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-500/15 text-brand-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
    sky: 'bg-sky-500/15 text-sky-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stat-card card-hover"
    >
      <div className="flex items-start justify-between">
        <div className={clsx('p-2 rounded-lg', colorMap[color] || colorMap.brand)}>
          <Icon className="w-4 h-4" />
        </div>
        {change !== undefined && (
          <div className={clsx('flex items-center gap-1 text-xs', change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">
          {value}
          {unit && <span className="text-sm font-normal text-surface-500 ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-surface-500">{title}</div>
      </div>
    </motion.div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse bg-dark-border rounded', className)} />
  )
}

// ── Loading State ──────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-8 h-8">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
      <p className="text-sm text-surface-500">{message}</p>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="p-4 rounded-2xl bg-dark-border">
        <Icon className="w-8 h-8 text-surface-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-surface-300">{title}</p>
        {description && <p className="text-xs text-surface-600 mt-1">{description}</p>}
      </div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── AI Stage Indicator ─────────────────────────────────────────
const AI_STAGES = [
  'Understanding request...',
  'Checking customer account...',
  'Searching knowledge base...',
  'Validating evidence...',
  'Preparing resolution...',
]

export function AIAnalysisStages({ stage }: { stage: number }) {
  return (
    <div className="space-y-2">
      {AI_STAGES.map((s, i) => (
        <div key={i} className={clsx(
          'flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all',
          i < stage ? 'text-emerald-400' :
          i === stage ? 'text-white bg-brand-950/50 border border-brand-800/30' :
          'text-surface-600'
        )}>
          <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
            i < stage ? 'bg-emerald-500/20' :
            i === stage ? 'border border-brand-500' :
            'border border-surface-700'
          )}>
            {i < stage && <span className="text-[8px]">✓</span>}
            {i === stage && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />}
          </div>
          <span className="text-xs">{s}</span>
          {i === stage && <div className="ml-auto flex gap-0.5">
            {[0,1,2].map(d => (
              <div key={d} className="w-1 h-1 rounded-full bg-brand-400 typing-dot" style={{ animationDelay: `${d*0.2}s` }} />
            ))}
          </div>}
        </div>
      ))}
    </div>
  )
}
