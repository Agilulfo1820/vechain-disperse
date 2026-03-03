'use client';

import { useQuery } from '@tanstack/react-query';
import { getNodeUrl, TOKEN_REGISTRY_URL, getNetworkType } from './constants';
import type { Token, ParsedEntry } from './types';
import { isVetDomain } from './parse';

export function useVetBalance(address?: string) {
  return useQuery({
    queryKey: ['vet-balance', address],
    queryFn: async () => {
      const res = await fetch(`${getNodeUrl()}/accounts/${address}`);
      if (!res.ok) throw new Error('Failed to fetch balance');
      const data = await res.json();
      return BigInt(data.balance) as bigint;
    },
    enabled: !!address,
    refetchInterval: 15000,
  });
}

export function useTokenBalance(address?: string, tokenAddress?: string) {
  return useQuery({
    queryKey: ['token-balance', address, tokenAddress],
    queryFn: async () => {
      // Call balanceOf(address) via Thor inspect endpoint
      const selector = '70a08231'; // balanceOf(address)
      const encodedAddress = address!.slice(2).toLowerCase().padStart(64, '0');
      const callData = '0x' + selector + encodedAddress;

      const res = await fetch(`${getNodeUrl()}/accounts/*`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauses: [{ to: tokenAddress, value: '0', data: callData }],
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch token balance');
      const results = await res.json();
      if (!results[0] || results[0].reverted) return 0n;
      return BigInt(results[0].data) as bigint;
    },
    enabled: !!address && !!tokenAddress,
    refetchInterval: 15000,
  });
}

/**
 * Resolves .vet domains in parsed entries to 0x addresses.
 * Returns a new array with domains replaced by resolved addresses,
 * plus a map of domain→address and any domains that failed to resolve.
 */
export function useResolveDomains(entries: ParsedEntry[]) {
  const domains = entries
    .map((e) => e.address)
    .filter(isVetDomain)
    .filter((d, i, arr) => arr.indexOf(d) === i); // dedupe

  const query = useQuery({
    queryKey: ['vet-domains', ...domains],
    queryFn: async () => {
      if (domains.length === 0) return {} as Record<string, string>;

      // VET domain registry: call getAddresses(string[])
      // Registry address on mainnet & testnet
      const registryAddress = '0xa9231da8BF8D10e2df3f6E03Dd5449693b56571a';

      // Resolve each domain individually via the public resolver
      const resolved: Record<string, string> = {};
      await Promise.all(
        domains.map(async (domain) => {
          try {
            // Use the VeChain name service lookup: GET /names/{domain}
            // Thor node doesn't expose this, so we call the registry contract
            // resolveName(string) selector = 0x1e59c529 — but the standard
            // approach is to use the vet.domains API
            const res = await fetch(
              `https://vet.domains/api/lookup/name/${encodeURIComponent(domain)}`,
            );
            if (!res.ok) return;
            const data = await res.json();
            if (data?.address && /^0x[0-9a-fA-F]{40}$/.test(data.address)) {
              resolved[domain] = data.address;
            }
          } catch {
            // skip unresolvable
          }
        }),
      );
      return resolved;
    },
    enabled: domains.length > 0,
    staleTime: 60_000,
  });

  const domainMap = query.data ?? {};
  const unresolved = domains.filter((d) => !(d in domainMap));

  // Build resolved entries: replace domain with address
  const resolvedEntries: ParsedEntry[] = entries.map((e) => {
    if (isVetDomain(e.address) && domainMap[e.address]) {
      return { ...e, address: domainMap[e.address] };
    }
    return e;
  });

  return {
    resolvedEntries,
    domainMap,
    unresolved,
    isResolving: query.isLoading && domains.length > 0,
  };
}

export function useTokenRegistry() {
  const network = getNetworkType();
  return useQuery<Token[]>({
    queryKey: ['token-registry', network],
    queryFn: async () => {
      const res = await fetch(`${TOKEN_REGISTRY_URL}/${network}.json`);
      if (!res.ok) throw new Error('Failed to fetch token registry');
      const tokens = await res.json();
      return tokens.map((t: Record<string, unknown>) => ({
        name: t.name as string,
        symbol: t.symbol as string,
        address: t.address as string,
        decimals: t.decimals as number,
        icon: t.icon ? `${TOKEN_REGISTRY_URL}/assets/${t.icon}` : '',
        desc: (t.desc as string) || '',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

