import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Inbox, Users, BookOpen,
  AlertTriangle, BarChart3, Activity, Settings,
  Zap, ChevronRight, Bell, Search,
  Brain, Shield, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/cases', icon: Inbox, label: 'Cases' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { path: '/escalations', icon: AlertTriangle, label: 'Escalations' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const bottomNavItems = [
  { path: '/system', icon: Activity, label: 'System Health' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [judgeMode, setJudgeMode] = useState(false)

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#06060c]">
      {/* Background Animated Ambient Gradient Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-blob-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/15 blur-[120px]" />
        <div className="ambient-blob-2 absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="ambient-blob-1 absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#0b0b16]/75 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.08]">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20">
            <Brain className="w-5 h-5 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-transparent">
              ResolveIQ
            </div>
            <div className="text-[10px] font-semibold text-brand-300/80 leading-none mt-0.5 tracking-wider uppercase">
              Customer Ops Intelligence
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <p className="section-title px-3 mb-2 flex items-center justify-between">
              <span>Navigation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            </p>
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx('nav-item w-full group', isActive && 'nav-item-active')}
                >
                  <item.icon className={clsx(
                    "w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-cyan-300" : "text-surface-400 group-hover:text-white"
                  )} />
                  <span className="font-semibold">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-300 opacity-80" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="border-t border-white/[0.08] pt-4 mt-3">
            <p className="section-title px-3 mb-2 flex items-center justify-between">
              <span>Tools</span>
            </p>
            {bottomNavItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx('nav-item w-full group', isActive && 'nav-item-active')}
                >
                  <item.icon className={clsx(
                    "w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-cyan-300" : "text-surface-400 group-hover:text-white"
                  )} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* AI Status & Judge Mode */}
        <div className="px-3 py-4 border-t border-white/[0.08] bg-[#090913]/60 backdrop-blur-md">
          <div className="px-3.5 py-3 rounded-xl bg-dark-bg/80 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="pulse-dot">
                <span className="bg-emerald-400" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">AI Engine Active</span>
            </div>
            <div className="text-[10px] font-medium text-emerald-300/80">Gemini 3.5 • Local RAG • FAISS</div>
          </div>

          <button
            onClick={() => setJudgeMode(!judgeMode)}
            className={clsx(
              "mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer",
              judgeMode
                ? "bg-gradient-to-r from-brand-700 to-indigo-700 text-white border border-brand-400/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                : "bg-dark-card/90 text-surface-300 hover:text-white border border-white/10 hover:border-brand-500/40"
            )}
          >
            <Zap className={clsx("w-3.5 h-3.5", judgeMode ? "text-amber-300 animate-bounce" : "text-surface-400")} />
            {judgeMode ? '⚡ Judge Mode Active' : 'Enable Judge Mode'}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.08] bg-[#080811]/60 backdrop-blur-2xl flex-shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                className="input pl-10 h-10 text-sm font-medium focus:ring-brand-500/60"
                placeholder="Search cases, customers, support articles (Ctrl + K)..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-xs text-emerald-300 font-bold tracking-wide">RAG Online</span>
            </div>

            <button className="relative p-2.5 rounded-xl bg-dark-card/60 border border-white/10 hover:bg-white/[0.08] hover:border-brand-500/30 transition-all duration-200 cursor-pointer">
              <Bell className="w-4 h-4 text-surface-300" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center border border-white/20 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-white tracking-wide">Agent Specialist</div>
                <div className="text-[10px] font-medium text-cyan-300/80">Broadband & Mobile Ops</div>
              </div>
            </div>
          </div>
        </header>

        {/* Judge Mode Banner */}
        <AnimatePresence>
          {judgeMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-brand-950 via-indigo-950 to-brand-900 border-b border-brand-500/40 px-6 py-3 shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
                <div className="flex items-center gap-6 text-xs text-surface-300 overflow-x-auto custom-scrollbar">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-amber-300 font-extrabold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-300" /> JUDGE PIPELINE ACTIVE
                    </span>
                    <span className="text-surface-600">|</span>
                    <span className="font-semibold text-white">INPUT:</span> Conversation + Account + Knowledge
                  </div>
                  <span className="text-brand-400 font-bold">→</span>
                  <span className="flex-shrink-0"><strong className="text-cyan-300">RETRIEVAL:</strong> FAISS Local Vector Search</span>
                  <span className="text-brand-400 font-bold">→</span>
                  <span className="flex-shrink-0"><strong className="text-indigo-300">EVIDENCE:</strong> Grounded Citations</span>
                  <span className="text-brand-400 font-bold">→</span>
                  <span className="flex-shrink-0"><strong className="text-emerald-300">OUTPUT:</strong> Resolvable / Info Request / Escalation</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
