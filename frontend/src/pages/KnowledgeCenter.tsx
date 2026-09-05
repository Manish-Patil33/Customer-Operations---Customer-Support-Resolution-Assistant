import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search } from 'lucide-react'
import { getKnowledgeArticles } from '../services/api'
import { LoadingState, EmptyState } from '../components/ui'
import type { KBArticle } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  'Billing': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Broadband': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Mobile': 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  'Plans': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Account': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Technical Support': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Operations': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'General': 'bg-surface-500/15 text-surface-400 border-surface-500/20',
}

export default function KnowledgeCenter() {
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KBArticle | null>(null)

  useEffect(() => {
    getKnowledgeArticles()
      .then(data => setArticles(data as KBArticle[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = articles.filter(a =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingState message="Loading knowledge base..." />

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Center</h1>
          <p className="text-sm text-surface-500 mt-0.5">{articles.length} support articles indexed</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input className="input pl-9 w-64" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 space-y-2">
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(a)}
              className={`card p-3 cursor-pointer card-hover ${selected?.id === a.id ? 'border-brand-500/40 bg-brand-950/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-brand-400">{a.id}</span>
                <span className={`badge text-[10px] border ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS['General']}`}>
                  {a.category}
                </span>
              </div>
              <p className="text-sm font-medium text-white leading-tight">{a.title}</p>
              <p className="text-xs text-surface-500 mt-1 line-clamp-2">{a.summary}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-surface-600">
                <span>v{a.version}</span>
                <span>•</span>
                <span>Updated {a.last_updated || 'N/A'}</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <EmptyState icon={BookOpen} title="No articles found" />}
        </div>

        <div className="xl:col-span-2">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6 space-y-4 h-full overflow-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-brand-400">{selected.id}</span>
                    <span className={`badge border ${CATEGORY_COLORS[selected.category] || CATEGORY_COLORS['General']}`}>
                      {selected.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                  <p className="text-xs text-surface-500 mt-1">
                    Version {selected.version} • Last updated: {selected.last_updated}
                  </p>
                </div>
              </div>
              <p className="text-sm text-surface-300 leading-relaxed">{selected.summary}</p>
              <div className="border-t border-dark-border pt-4">
                <p className="text-xs text-surface-500">Full article content available in data/knowledge/{selected.id.toLowerCase().replace('-','_')}.md</p>
                <p className="text-xs text-surface-600 mt-1">{selected.content_length.toLocaleString()} characters</p>
              </div>
            </motion.div>
          ) : (
            <div className="card h-full flex items-center justify-center">
              <EmptyState icon={BookOpen} title="Select an article" description="Click an article to view details" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
