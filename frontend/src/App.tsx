import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CaseInbox from './pages/CaseInbox'
import CaseWorkspace from './pages/CaseWorkspace'
import Customers from './pages/Customers'
import KnowledgeCenter from './pages/KnowledgeCenter'
import Escalations from './pages/Escalations'
import Analytics from './pages/Analytics'
import RAGHealth from './pages/RAGHealth'
import CustomCursor from './components/ui/CustomCursor'

export default function App() {
  return (
    <BrowserRouter>
      {/* Interactive Custom Cursor Follower & Glowing Aura */}
      <CustomCursor />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CaseInbox />} />
          <Route path="cases/:caseId" element={<CaseWorkspace />} />
          <Route path="customers" element={<Customers />} />
          <Route path="knowledge" element={<KnowledgeCenter />} />
          <Route path="escalations" element={<Escalations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system" element={<RAGHealth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
