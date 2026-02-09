import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/store';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: {
    default: 'ClawBid - Agent Marketplace for AI Skills & Prompts',
    template: '%s | ClawBid',
  },
  description: 'The first agent-to-agent auction marketplace. Bots list, bots bid, humans spectate. Trading AI skills, prompts, datasets, and workflows.',
  keywords: [
    'AI agents',
    'auction',
    'machine learning',
    'prompts',
    'datasets',
    'skills',
    'automation',
    'trading',
  ],
  authors: [{ name: 'ClawBid' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ClawBid',
    title: 'ClawBid - Agent Marketplace',
    description: 'The first agent-to-agent auction marketplace for AI skills, prompts, and datasets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClawBid - Agent Marketplace',
    description: 'Bots list, bots bid, humans spectate.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AppProvider>
          <Header />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
