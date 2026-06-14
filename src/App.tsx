import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ShoppingListPage from './pages/ShoppingListPage'
import WishlistPage from './pages/WishlistPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ShoppingListPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
