import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getRagHealth } from '../services/api'
import { LoadingState } from '../components/ui'
import type { RAGHealth } from '../types'
import clsx from 'clsx'

function StatusDot({ status }: { status: string }) {
  const ok = ['connected', 'loaded', 'active'].includes(status)
  const warn = ['inactive', 'unverified'].includes(status)
  return (
    <div className={clsx(
      'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
      ok ? 'bg-emerald-500/15 text-emerald-400' :
      warn ? 'bg-amber-500/15 text-amber-400' :
      'bg-red-500/15 text-red-400'
    )}>
      {ok ? <CheckCircle className="w-3 h-3" /> : warn ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {status}
    </div>
  )
}

export default function RAGHealth() {
  const [health, setHealth] = useState<RAGHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRagHealth()
      .then(data => setHealth(data as RAGHealth))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading system status..." />
  if (!health) return null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/20">
          <Activity className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">System Health</h1>
          <p className="text-sm text-surface-500 mt-0.5">RAG pipeline, AI, and service status</p>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Gemini API', status: health.gemini_api.status, detail: health.gemini_api.model },
          { label: 'Vector Index', status: health.vector_index.status, detail: `${health.vector_index.num_chunks} chunks` },
          { label: 'Retriever', status: health.retriever.status, detail: `top-${health.retriever.top_k}, threshold ${health.retriever.threshold}` },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{s.label}</span>
              <StatusDot status={s.status} />
            </div>
            <p className="text-xs text-surface-500">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">Gemini Configuration</h3>
          {[
            ['Status', health.gemini_api.status],
            ['Reasoning Model', health.gemini_api.model],
            ['Embedding Model', health.gemini_api.embedding_model],
            ['API Key', health.gemini_api.api_key_configured ? '✓ Configured (not exposed)' : '✗ Not set'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs border-b border-dark-border pb-2 last:border-0">
              <span className="text-surface-500">{k}</span>
              <span className={clsx('font-medium', (v as string).includes('✗') ? 'text-red-400' : 'text-white')}>{v}</span>
            </div>
          ))}
        </motion.div>

        {/* Vector index */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">Vector Index</h3>
          {[
            ['Type', health.vector_index.type],
            ['Status', health.vector_index.status],
            ['Chunks Indexed', health.vector_index.num_chunks],
            ['Documents', health.vector_index.num_documents],
            ['Embedding Dimension', health.vector_index.dimension],
            ['Precomputed', health.index_precomputed ? '✓ Yes (committed)' : '✗ Not yet built'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs border-b border-dark-border pb-2 last:border-0">
              <span className="text-surface-500">{k}</span>
              <span className="font-medium text-white">{String(v)}</span>
            </div>
          ))}
        </motion.div>

        {/* External services NOT used */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">External Services</h3>
          <p className="text-xs text-surface-500 mb-2">This project uses NO external AI services except Google Gemini.</p>
          {Object.entries(health.external_services || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs border-b border-dark-border pb-2 last:border-0">
              <span className="text-surface-500">{k}</span>
              <span className="font-medium text-emerald-400">{String(v)}</span>
            </div>
          ))}
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">RAG Pipeline</h3>
          <div className="space-y-2">
            {(health.pipeline || []).map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-brand-400 font-bold">{i + 1}</span>
                </div>
                <span className="text-surface-300">{step}</span>
                {i < (health.pipeline?.length || 0) - 1 && (
                  <div className="ml-1 w-px h-3 bg-dark-border self-end" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Retriever config */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-3">Retrieval Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Method', health.retriever.method],
            ['Top-K Results', health.retriever.top_k],
            ['Relevance Threshold', health.retriever.threshold],
            ['Fallback Enabled', health.fallback_enabled ? 'Yes' : 'No'],
          ].map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg bg-dark-bg border border-dark-border text-xs">
              <p className="text-surface-500 mb-1">{k}</p>
              <p className="font-medium text-white">{String(v)}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
