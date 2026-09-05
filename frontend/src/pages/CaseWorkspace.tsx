import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Brain, AlertTriangle, CheckCircle, HelpCircle,
  FileText, MessageSquare, ChevronDown, ChevronUp,
  RotateCcw
} from 'lucide-react'
import { getCase, analyzeCase, approveResolution, escalateCase } from '../services/api'
import {
  DecisionBadge, PriorityBadge, ConfidenceMeter,
  LoadingState, EmptyState, AIAnalysisStages
} from '../components/ui'
import type { DemoCase, AIResolutionOutput } from '../types'
import clsx from 'clsx'

export default function CaseWorkspace() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<DemoCase | null>(null)
  const [analysis, setAnalysis] = useState<AIResolutionOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState(0)
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)
  const [showExplainability, setShowExplainability] = useState(false)
  const [approved, setApproved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!caseId) return
    getCase(caseId)
      .then(data => setCaseData(data as DemoCase))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [caseId])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleAnalyze = async () => {
    if (!caseId) return
    setAnalyzing(true)
    setAnalysis(null)
    setAnalysisStage(0)
    setApproved(false)

    // Animate through stages
    for (let i = 0; i <= 4; i++) {
      await new Promise(r => setTimeout(r, 700))
      setAnalysisStage(i)
    }

    try {
      const result = await analyzeCase(caseId)
      setAnalysis(result as AIResolutionOutput)
    } catch (e: any) {
      showToast(`Analysis failed: ${e.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApprove = async () => {
    if (!caseId) return
    await approveResolution(caseId)
    setApproved(true)
    showToast('Resolution approved! (Demo mode — no message sent to customer.)')
  }

  const handleEscalate = async () => {
    if (!caseId) return
    await escalateCase(caseId)
    showToast('Case escalated to Tier-2 queue.')
  }

  if (loading) return <LoadingState message="Loading case..." />
  if (!caseData) return <EmptyState icon={FileText} title="Case not found" />

  const conversation = caseData.conversation
  const customer = caseData.customer

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-dark-border flex-shrink-0">
        <button onClick={() => navigate('/cases')} className="btn-secondary py-1.5 px-3 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Cases
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-brand-400">{caseData.case_id}</span>
          <span className="text-surface-600">•</span>
          <span className="text-sm text-white font-medium truncate max-w-sm">{caseData.title}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <PriorityBadge priority={caseData.priority} />
          <span className="text-xs text-surface-500 bg-dark-bg border border-dark-border px-2 py-0.5 rounded-full">
            {caseData.scenario_label}
          </span>
        </div>
      </div>

      {/* 3-column workspace */}
      <div className="flex-1 grid grid-cols-[320px_1fr_300px] overflow-hidden">

        {/* LEFT — Conversation */}
        <div className="border-r border-dark-border overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white mb-3">Customer Conversation</h3>
            <div className="space-y-3">
              {conversation?.messages?.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2', msg.role === 'customer' ? 'justify-start' : msg.role === 'system' ? 'justify-center' : 'justify-end')}>
                  {msg.role === 'system' ? (
                    <div className="text-xs text-surface-600 bg-dark-bg border border-dark-border px-3 py-1 rounded-full">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={clsx(
                      'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                      msg.role === 'customer'
                        ? 'bg-dark-border text-surface-300'
                        : 'bg-brand-600/80 text-white'
                    )}>
                      <div className="font-medium mb-0.5 text-[10px] opacity-70">
                        {msg.role === 'customer' ? 'Customer' : 'Agent'}
                      </div>
                      {msg.content}
                    </div>
                  )}
                </div>
              )) || <p className="text-xs text-surface-600">No conversation loaded.</p>}
            </div>
          </div>

          {/* Extracted facts */}
          {(conversation?.extracted_facts?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 mb-2">Extracted Facts</h4>
              <div className="space-y-1">
                {(conversation?.extracted_facts ?? []).map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-surface-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER — AI Resolution */}
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Resolution Intelligence</h3>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className={clsx('btn-primary text-xs', analyzing && 'opacity-70 cursor-not-allowed')}
            >
              <Brain className="w-3.5 h-3.5" />
              {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze Case'}
            </button>
          </div>

          {/* Analysis stages */}
          {analyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-4"
            >
              <p className="text-xs text-surface-500 mb-3">AI Processing...</p>
              <AIAnalysisStages stage={analysisStage} />
            </motion.div>
          )}

          {/* Analysis Result */}
          {analysis && !analyzing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Decision card */}
              <div className={clsx(
                'card p-4 border',
                analysis.decision.type === 'RESOLVE' ? 'border-emerald-500/25 bg-emerald-500/5' :
                analysis.decision.type === 'ASK_INFORMATION' ? 'border-amber-500/25 bg-amber-500/5' :
                'border-red-500/25 bg-red-500/5'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-surface-400">Recommended Action</span>
                  <DecisionBadge decision={analysis.decision.type} />
                </div>
                <p className="text-xs text-surface-300 leading-relaxed">{analysis.decision.reason}</p>
              </div>

              {/* Contradiction radar */}
              {analysis.contradictions?.length > 0 && (
                <div className="card p-4 border border-amber-500/25 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">⚠ Contradiction Detected</span>
                  </div>
                  {analysis.contradictions.map((c, i) => (
                    <div key={i} className="space-y-2 text-xs">
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 rounded bg-dark-bg">
                          <span className="text-surface-500">{c.source_a}:</span>
                          <p className="text-amber-300 mt-0.5">{c.claim_a}</p>
                        </div>
                        <div className="flex-1 p-2 rounded bg-dark-bg">
                          <span className="text-surface-500">{c.source_b}:</span>
                          <p className="text-amber-300 mt-0.5">{c.claim_b}</p>
                        </div>
                      </div>
                      <p className="text-surface-500">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Case understanding */}
              <div className="card p-4 space-y-3">
                <h4 className="text-xs font-semibold text-white">Case Understanding</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-surface-500 mb-1">Issue</p>
                    <p className="text-white">{analysis.case_classification.intent}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 mb-1">Category</p>
                    <p className="text-white capitalize">{analysis.case_classification.category}</p>
                  </div>
                </div>

                {analysis.established_facts?.length > 0 && (
                  <div>
                    <p className="text-surface-500 text-xs mb-1.5">Established</p>
                    <div className="space-y-1">
                      {analysis.established_facts.map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-surface-300">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.missing_information?.length > 0 && (
                  <div>
                    <p className="text-surface-500 text-xs mb-1.5">Missing</p>
                    <div className="space-y-1">
                      {analysis.missing_information.map((m, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                          <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.already_tried?.length > 0 && (
                  <div>
                    <p className="text-surface-500 text-xs mb-1.5">Already Tried</p>
                    <div className="space-y-1">
                      {analysis.already_tried.map((t, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-surface-500 line-through">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 no-underline" />
                          <span className="no-underline not-italic">{t}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-400 mt-2">⚠ Do not ask the customer to repeat these steps.</p>
                  </div>
                )}
              </div>

              {/* Confidence + Coverage */}
              <div className="card p-4 space-y-3">
                <h4 className="text-xs font-semibold text-white">Confidence Metrics</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-500">AI Confidence</span>
                      <span className="text-white">{Math.round(analysis.confidence * 100)}%</span>
                    </div>
                    <ConfidenceMeter value={analysis.confidence} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-500">Knowledge Coverage</span>
                      <span className={analysis.knowledge_coverage < 0.5 ? 'text-red-400' : 'text-white'}>
                        {Math.round(analysis.knowledge_coverage * 100)}%
                      </span>
                    </div>
                    <ConfidenceMeter value={analysis.knowledge_coverage} />
                  </div>
                  {analysis.draft_quality > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-500">Draft Quality</span>
                        <span className="text-white">{Math.round(analysis.draft_quality * 100)}%</span>
                      </div>
                      <ConfidenceMeter value={analysis.draft_quality} />
                    </div>
                  )}
                </div>
                {analysis.knowledge_coverage === 0 && (
                  <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-400">KNOWLEDGE GAP — Knowledge coverage insufficient</span>
                  </div>
                )}
              </div>

              {/* Resolution draft or Minimum info or Handoff */}
              {analysis.decision.type === 'RESOLVE' && analysis.resolution_draft && (
                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white">AI Resolution Draft</h4>
                    <span className={clsx(
                      'badge',
                      analysis.draft_quality >= 0.8 ? 'badge-ai-ready' : 'badge-needs-info'
                    )}>
                      Quality: {Math.round(analysis.draft_quality * 100)}%
                    </span>
                  </div>
                  <pre className="text-xs text-surface-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {analysis.resolution_draft}
                  </pre>
                  <div className="flex gap-2">
                    {!approved ? (
                      <button onClick={handleApprove} className="btn-primary text-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve & Send (Demo)
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    <button onClick={handleAnalyze} className="btn-secondary text-xs">
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button onClick={handleEscalate} className="btn-danger text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" /> Escalate
                    </button>
                  </div>
                </div>
              )}

              {analysis.decision.type === 'ASK_INFORMATION' && analysis.minimum_info_required?.length > 0 && (
                <div className="card p-4 space-y-3 border border-amber-500/20 bg-amber-500/5">
                  <h4 className="text-xs font-semibold text-amber-400">Minimum Information Required</h4>
                  {analysis.minimum_info_required.map((info, i) => (
                    <div key={i} className="space-y-1 pb-2 border-b border-dark-border last:border-0">
                      <p className="text-xs font-medium text-white">{info.field}</p>
                      <p className="text-xs text-surface-500">Why: {info.why}</p>
                      <div className="flex items-start gap-2 p-2 rounded bg-dark-bg border border-dark-border">
                        <MessageSquare className="w-3 h-3 text-brand-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-white italic">"{info.question}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.decision.type === 'ESCALATE' && analysis.handoff_summary && (
                <div className="card p-4 space-y-3 border border-red-500/20 bg-red-500/5">
                  <h4 className="text-xs font-semibold text-red-400">Human Escalation Required</h4>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-surface-400 mb-2">Agent Handoff Summary</h5>
                    <pre className="text-xs text-surface-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {analysis.handoff_summary}
                    </pre>
                  </div>
                  <button onClick={handleEscalate} className="btn-danger text-xs w-full justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" /> Create Escalation
                  </button>
                </div>
              )}

              {/* Explainability */}
              <button
                onClick={() => setShowExplainability(!showExplainability)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-700/30 transition-colors text-xs"
              >
                <span className="font-medium text-white">Why did ResolveIQ choose this?</span>
                {showExplainability ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {showExplainability && analysis.explainability && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="card p-4 space-y-2 text-xs">
                      {Object.entries(analysis.explainability).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-surface-500 capitalize w-32 flex-shrink-0">{k.replace(/_/g,' ')}</span>
                          <span className="text-surface-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {!analysis && !analyzing && (
            <div className="card p-8 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
                <Brain className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Ready to analyze</p>
                <p className="text-xs text-surface-500 mt-1">Click "Analyze Case" to run the AI resolution pipeline</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Evidence + Customer */}
        <div className="border-l border-dark-border overflow-y-auto p-4 space-y-4">
          {/* Customer 360 */}
          {customer && (
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-white">Customer 360</h3>
              <div>
                <p className="text-sm font-bold text-white">{customer.name}</p>
                <p className="text-xs text-surface-500">{customer.customer_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-surface-600">Plan</p>
                  <p className="text-white font-medium">{customer.plan}</p>
                </div>
                <div>
                  <p className="text-surface-600">Monthly</p>
                  <p className="text-white font-medium">₹{customer.plan_price}</p>
                </div>
                <div>
                  <p className="text-surface-600">Status</p>
                  <span className={clsx('badge text-[10px]',
                    customer.service_status === 'active' ? 'badge-ai-ready' : 'badge-escalate'
                  )}>
                    {customer.service_status}
                  </span>
                </div>
                <div>
                  <p className="text-surface-600">Billing</p>
                  <span className={clsx('badge text-[10px]',
                    customer.billing_status === 'paid' ? 'badge-ai-ready' :
                    customer.billing_status === 'overdue' ? 'badge-escalate' : 'badge-needs-info'
                  )}>
                    {customer.billing_status}
                  </span>
                </div>
              </div>

              <div className="border-t border-dark-border pt-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-surface-600">Current Bill</span>
                  <span className={clsx('font-medium', customer.current_bill > customer.previous_bill ? 'text-amber-400' : 'text-white')}>
                    ₹{customer.current_bill}
                  </span>
                </div>
                {customer.current_bill !== customer.previous_bill && (
                  <div className="flex justify-between">
                    <span className="text-surface-600">Previous</span>
                    <span className="text-surface-500">₹{customer.previous_bill}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-600">Last Payment</span>
                  <span className="text-white">₹{customer.last_payment_amount}</span>
                </div>
              </div>

              {customer.account_notes && (
                <div className="p-2 rounded bg-dark-bg border border-dark-border">
                  <p className="text-[10px] text-surface-500 mb-1">Account Notes</p>
                  <p className="text-xs text-amber-300">{customer.account_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Evidence Panel */}
          {analysis && analysis.retrieved_evidence?.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-white">Evidence & Sources</h3>
              <div className="space-y-2">
                {analysis.retrieved_evidence.map((ev, i) => (
                  <div key={i} className="rounded-lg bg-dark-bg border border-dark-border overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                      onClick={() => setExpandedEvidence(expandedEvidence === ev.chunk_id ? null : (ev.chunk_id || String(i)))}
                    >
                      <span className={clsx('badge text-[10px]',
                        ev.source_type === 'KNOWLEDGE' ? 'badge-knowledge' :
                        ev.source_type === 'ACCOUNT' ? 'badge-account' : 'badge-conversation'
                      )}>
                        {ev.source_type}
                      </span>
                      <span className="text-xs text-white flex-1 truncate">{ev.source_id}</span>
                      <span className="text-xs text-surface-500 font-mono">{ev.relevance_score.toFixed(2)}</span>
                      {expandedEvidence === (ev.chunk_id || String(i)) ? <ChevronUp className="w-3 h-3 text-surface-500" /> : <ChevronDown className="w-3 h-3 text-surface-500" />}
                    </button>
                    <AnimatePresence>
                      {expandedEvidence === (ev.chunk_id || String(i)) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-2">
                            <p className="text-xs font-medium text-surface-400">{ev.title}</p>
                            <p className="text-xs text-surface-500 leading-relaxed">{ev.snippet}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {caseData.tickets && caseData.tickets.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-white">Recent Tickets</h3>
              <div className="space-y-2">
                {caseData.tickets.slice(0, 4).map(t => (
                  <div key={t.ticket_id} className="p-2 rounded-lg bg-dark-bg border border-dark-border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-brand-400 text-[10px]">{t.ticket_id}</span>
                      <span className={clsx('badge text-[10px]',
                        t.status === 'resolved' ? 'badge-ai-ready' :
                        t.status === 'open' ? 'badge-escalate' : 'badge-needs-info'
                      )}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-surface-300 truncate">{t.subject}</p>
                    {t.agent_notes && (
                      <p className="text-surface-600 text-[10px] mt-0.5 truncate">{t.agent_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-dark-card border border-dark-border shadow-card text-sm text-white"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
