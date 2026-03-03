import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'disperse',
  description:
    'Send VET or ERC-20 tokens to multiple addresses in a single transaction on VeChain.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'disperse',
    description:
      'Distribute VET or tokens to multiple addresses in one transaction. Powered by VeChain multi-clause.',
    siteName: 'disperse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'disperse',
    description:
      'Distribute VET or tokens to multiple addresses in one transaction. Powered by VeChain multi-clause.',
  },
  metadataBase: new URL('https://disperse.me'),
  keywords: ['vechain', 'disperse', 'multi-send', 'batch transfer', 'VET', 'token', 'multi-clause'],
  applicationName: 'disperse',
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
    </html>
  );
}
