// Shared domain types for Family Shop.
// Placeholder definitions — expand as features land.

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  checked: boolean
  createdAt: number
}

export interface WishlistItem {
  id: string
  title: string
  url?: string
  reserved: boolean
  createdAt: number
}
