import { NavLink, Outlet } from 'react-router-dom'
import { ChevronDown, ListTodo, Gift, Menu, Zap } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { AliasSwitcher } from '../alias/AliasSwitcher'
import { Avatar } from './ui'
import { useAuthUser } from '../auth/auth-context'
import { cn } from '../lib/cn'

const navItems = [
  { to: '/', label: 'Quick', icon: Zap, end: true },
  { to: '/lists', label: 'Lists', icon: ListTodo, end: false },
  { to: '/wishlists', label: 'Wishlists', icon: Gift, end: false },
  { to: '/more', label: 'More', icon: Menu, end: false },
]

export default function Layout() {
  const { activeAlias, switcherOpen, setSwitcherOpen } = useAlias()
  const { user } = useAuthUser()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ink-100">
      {/* Header: alias switcher trigger + profile avatar */}
      <header className="sticky top-0 z-20 bg-white/90 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-safe shadow-sm backdrop-blur">
        <div className="flex h-14 items-center justify-between">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-1.5 rounded-card px-2 py-1.5 text-left hover:bg-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Switch space"
          >
            <span className="max-w-[60vw] truncate text-base font-semibold text-ink-900">
              {activeAlias?.name ?? 'Family Shop'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />
          </button>
          <Avatar
            name={user?.displayName}
            photoURL={user?.photoURL}
            size="sm"
          />
        </div>
      </header>

      {/* Routed content */}
      <main className="flex flex-1 flex-col px-4 py-4 pb-28">
        <Outlet />
      </main>

      {/* Bottom navigation — safe-area aware (NFR-4) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-ink-200 bg-white/95 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-safe-nav pt-1.5 shadow-nav backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 rounded-card py-1.5 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-primary-600'
                      : 'text-ink-400 hover:text-ink-600',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('h-6 w-6', isActive && 'fill-primary-100')}
                      aria-hidden
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Alias switcher (FR-3/4/5/6) */}
      <AliasSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </div>
  )
}
