'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { getNetworkType } from './lib/constants';

const VeChainKitProvider = dynamic(
  () => import('@vechain/vechain-kit').then((mod) => mod.VeChainKitProvider),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const networkType = getNetworkType();

  return (
    <QueryClientProvider client={queryClient}>
      <VeChainKitProvider
        network={{ type: networkType }}
        darkMode={false}
        language="en"
        loginModalUI={{
          description: 'disperse — send to many',
        }}
        loginMethods={[{ method: 'dappkit', gridColumn: 4 }]}
        theme={{
          modal: {
            backgroundColor: '#f5f3ef',
            borderRadius: '0',
            rounded: 0,
          },
          textColor: '#1a1a1a',
          buttons: {
            primaryButton: {
              bg: '#7dd3c7',
              color: '#1a1a1a',
              rounded: 0,
            },
            secondaryButton: {
              bg: 'transparent',
              color: '#1a1a1a',
              border: '1px solid #1a1a1a',
              rounded: 0,
            },
            tertiaryButton: {
              bg: 'transparent',
              color: '#1a1a1a',
              rounded: 0,
            },
            loginButton: {
              bg: 'transparent',
              color: '#1a1a1a',
              border: '1px solid #ccc',
              rounded: 0,
            },
          },
          fonts: { family: "'Playfair Display', serif" },
        }}
        dappKit={{
          allowedWallets: ['veworld'],
        }}
      >
        {children}
      </VeChainKitProvider>
    </QueryClientProvider>
  );
}
