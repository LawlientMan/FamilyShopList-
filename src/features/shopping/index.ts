// Reusable shopping-item feature — shared by Screen 1 (Quick list, FR-9) and
// Screen 2 item views (named Lists, FR-10.3). Items share one document shape
// (DATA-MODEL.md); these are collection-ref agnostic so a list passes
// paths.listItems(aliasId, listId) and the Quick list passes
// paths.quickItems(aliasId).

export { ShoppingItemsView } from './ShoppingItemsView'
export type { ShoppingItemsViewProps } from './ShoppingItemsView'
export { AddItemForm } from './AddItemForm'
export type { AddItemFormProps } from './AddItemForm'
export { ShoppingItemRow } from './ShoppingItemRow'
export type { ShoppingItemRowProps } from './ShoppingItemRow'
export { BoughtSection } from './BoughtSection'
export type { BoughtSectionProps } from './BoughtSection'
export { useShoppingItems } from './useShoppingItems'
export type { ShoppingItemsState } from './useShoppingItems'
export { useSuggestions } from './useSuggestions'
