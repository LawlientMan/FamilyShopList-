// Shared icon set for lists and wishlists (FR-16). lucide icons keyed
// by a stable string. The key is what we persist on the list/wishlist doc; the
// component is looked up here at render time. Adding/removing keys here is the
// single source of truth — DATA-MODEL.md stores only the key string.

import {
  Apple,
  Baby,
  Beer,
  BookOpen,
  Cake,
  Carrot,
  Coffee,
  Croissant,
  Fish,
  Flame,
  Gift,
  Heart,
  Home,
  Leaf,
  Milk,
  Music,
  PawPrint,
  Pill,
  Pizza,
  Plane,
  ShoppingBasket,
  ShoppingCart,
  Shirt,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TreePine,
  Wrench,
  Banana,
  Bath,
  Beef,
  Bird,
  Camera,
  Candy,
  Car,
  Cat,
  Cherry,
  Cookie,
  Cross,
  CupSoda,
  Dog,
  Drumstick,
  Dumbbell,
  Egg,
  Flower,
  Fuel,
  Gamepad2,
  Gem,
  Hammer,
  Headphones,
  HeartPulse,
  IceCream,
  Lightbulb,
  Salad,
  Sandwich,
  Smartphone,
  Soup,
  SprayCan,
  Stethoscope,
  Syringe,
  Thermometer,
  Utensils,
  Watch,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Order here is the order rendered in the IconPicker grid.
export const ICON_SET: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  basket: ShoppingBasket,
  gift: Gift,
  home: Home,
  plane: Plane,
  cake: Cake,
  tree: TreePine,
  heart: Heart,
  star: Star,
  bottle: Milk,
  carrot: Carrot,
  apple: Apple,
  pizza: Pizza,
  coffee: Coffee,
  beer: Beer,
  fish: Fish,
  milk: Milk,
  bread: Croissant,
  paw: PawPrint,
  baby: Baby,
  shirt: Shirt,
  wrench: Wrench,
  leaf: Leaf,
  flame: Flame,
  snowflake: Snowflake,
  sun: Sun,
  music: Music,
  book: BookOpen,
  pill: Pill,
  sparkles: Sparkles,
  cafe: CupSoda,
  utensils: Utensils,
  soup: Soup,
  egg: Egg,
  sandwich: Sandwich,
  salad: Salad,
  meat: Beef,
  drumstick: Drumstick,
  cherry: Cherry,
  banana: Banana,
  cookie: Cookie,
  candy: Candy,
  icecream: IceCream,
  wine: Wine,
  stethoscope: Stethoscope,
  syringe: Syringe,
  pulse: HeartPulse,
  medical: Cross,
  thermometer: Thermometer,
  lightbulb: Lightbulb,
  hammer: Hammer,
  cleaning: SprayCan,
  bath: Bath,
  car: Car,
  fuel: Fuel,
  headphones: Headphones,
  phone: Smartphone,
  camera: Camera,
  watch: Watch,
  game: Gamepad2,
  gem: Gem,
  fitness: Dumbbell,
  dog: Dog,
  cat: Cat,
  bird: Bird,
  flower: Flower,
}

// Stable key order (insertion order of ICON_SET).
export const ICON_KEYS = Object.keys(ICON_SET)

// Defaults for pre-v1.3 docs (no icon/color) and for new docs (FR-16).
export const DEFAULT_ICON_KEY = 'cart'
export const DEFAULT_COLOR = '#0d9488' // brand teal (matches PWA theme_color)

// 8 color presets for the ColorPicker (FR-16); first is the brand teal default.
export const COLOR_PRESETS = [
  DEFAULT_COLOR, // teal
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#ca8a04', // amber
  '#16a34a', // green
]

// Resolve a (possibly undefined / unknown) key to a component, never null.
export function getIcon(key: string | undefined | null): LucideIcon {
  return (key && ICON_SET[key]) || ICON_SET[DEFAULT_ICON_KEY]
}
