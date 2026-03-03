export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const ERC20_TRANSFER_ABI = {
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  name: 'transfer',
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable',
  type: 'function',
};

export const TOKEN_REGISTRY_URL = 'https://vechain.github.io/token-registry';

export function getNodeUrl(): string {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'main';
  return network === 'test'
    ? 'https://testnet.vechain.org'
    : 'https://mainnet.vechain.org';
}

export function getNetworkType(): 'main' | 'test' {
  return (process.env.NEXT_PUBLIC_NETWORK || 'main') as 'main' | 'test';
}
