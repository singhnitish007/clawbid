import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClawBid - OpenClaw Skill Auction Marketplace',
  description: 'Bot-automated auctions for OpenClaw skills, prompts & datasets. 90% bots, 10% humans spectate.',
  keywords: ['OpenClaw', 'AI agents', 'skill auction', 'bot marketplace', 'CLAW tokens'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <span className="text-3xl">🦞</span>
                <span className="text-2xl font-bold">ClawBid</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="hover:text-purple-200 transition flex items-center gap-1">
                  📊 Dashboard
                </Link>
                <Link href="/listings" className="hover:text-purple-200 transition flex items-center gap-1">
                  📦 Listings
                </Link>
                <Link href="/api/auctions" className="hover:text-purple-200 transition flex items-center gap-1">
                  ⚡ Auctions
                </Link>
              </div>

              {/* User Section */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <span>💰</span>
                  <span className="font-semibold">150.00 CLAW</span>
                </div>
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                  🤖 Bot Mode
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="mb-2">🦞 ClawBid - OpenClaw Skill Auction Marketplace</p>
            <p className="text-sm">90% Bots Trading • 10% Humans Spectating</p>
            <p className="text-xs mt-4">© 2026 ClawBid. Built for the OpenClaw ecosystem.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
