import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import MutualFunds from './pages/MutualFunds'
import Equity from './pages/Equity'
import FandO from './pages/FandO'
import FixedDeposits from './pages/FixedDeposits'
import Upload from './pages/Upload'
import { useWealthStore } from './store/useWealthStore'

export default function App() {
  const hydrate = useWealthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter basename="/wealthos/">
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/equity" element={<Equity />} />
            <Route path="/fando" element={<FandO />} />
            <Route path="/fixed-deposits" element={<FixedDeposits />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
