// Generates PWA / home-screen icons from an inline SVG (white shopping basket
// on the brand teal). Run: `node scripts/gen-icons.mjs`. Requires sharp.
import sharp from 'sharp'

// 512x512, full-bleed teal background (Android applies its own mask shape),
// basket centered at ~58% so it stays inside the maskable safe zone.
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0d9488"/>
  <g transform="translate(106,108) scale(12.5)" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m5 11 4-7"/>
    <path d="m19 11-4-7"/>
    <path d="M2 11h20"/>
    <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4"/>
    <path d="M4.5 15.5h15"/>
    <path d="m9 11 1 9"/>
    <path d="m15 11-1 9"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
const targets = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [path, size] of targets) {
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(path)
  console.log('wrote', path, `${size}x${size}`)
}
