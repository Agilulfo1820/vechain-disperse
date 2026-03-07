import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Disperse on VeChain',
  description:
    'Send VET or ERC-20 tokens to multiple addresses in a single transaction on VeChain.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Disperse on VeChain',
    description:
      'Distribute VET or tokens to multiple addresses in one transaction. Powered by VeChain multi-clause.',
    siteName: 'Disperse on VeChain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Disperse on VeChain',
    description:
      'Distribute VET or tokens to multiple addresses in one transaction. Powered by VeChain multi-clause.',
  },
  metadataBase: new URL('https://disperse.me'),
  keywords: ['vechain', 'disperse', 'multi-send', 'batch transfer', 'VET', 'token', 'multi-clause'],
  applicationName: 'Disperse on VeChain',
  authors: [{ name: 'disperse.me' }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
