import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-gray-600 hover:bg-gray-100',
  ].join(' ')

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <header className="bg-indigo-600 px-4 py-4 text-white shadow">
        <h1 className="text-lg font-bold">Family Shop</h1>
      </header>

      <nav className="flex gap-2 border-b border-gray-200 bg-white p-2">
        <NavLink to="/" end className={tabClass}>
          Покупки
        </NavLink>
        <NavLink to="/wishlist" className={tabClass}>
          Вишлист
        </NavLink>
      </nav>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
