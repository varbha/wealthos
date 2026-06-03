import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'

const links = [
  { to: '/overview', label: 'Overview', icon: '◈' },
  { to: '/mutual-funds', label: 'Mutual Funds', icon: '◎' },
  { to: '/equity', label: 'Equity', icon: '◇' },
  { to: '/fando', label: 'F&O', icon: '◆' },
  { to: '/fixed-deposits', label: 'Fixed Deposits', icon: '▣' },
  { to: '/upload', label: 'Upload Data', icon: '↑' },
]

export default function Sidebar() {
  const { dark, toggle } = useDarkMode()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <>
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">WealthOS</span>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base w-4 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
        >
          <span>{dark ? '☀' : '☾'}</span>
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <span className="text-base font-bold text-gray-900 dark:text-white">WealthOS</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {navContent}
      </aside>
    </>
  )
}
