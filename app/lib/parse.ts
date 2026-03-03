import type { ParseResult } from './types';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const VET_DOMAIN_RE = /^[a-zA-Z0-9-]+\.vet$/;
const AMOUNT_RE = /^\d+(\.\d+)?$/;

export function isVetDomain(value: string): boolean {
  return VET_DOMAIN_RE.test(value);
}

export function parseInput(text: string): ParseResult {
  const entries: ParseResult['entries'] = [];
  const errors: ParseResult['errors'] = [];

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) continue;

    // skip CSV header
    if (
      i === 0 &&
      trimmed.toLowerCase().includes('address') &&
      trimmed.toLowerCase().includes('amount')
    ) {
      continue;
    }

    // split by comma, space, or tab
    const tokens = trimmed.split(/[,\s\t]+/).filter(Boolean);

    const address = tokens.find((t) => ADDRESS_RE.test(t));
    const domain = !address ? tokens.find((t) => isVetDomain(t)) : undefined;
    const recipient = address ?? domain;
    const amount = tokens.find((t) => AMOUNT_RE.test(t) && parseFloat(t) > 0);

    if (!recipient && !amount) {
      errors.push({ line: i + 1, message: 'no valid address or amount', raw: trimmed });
    } else if (!recipient) {
      errors.push({ line: i + 1, message: 'invalid address', raw: trimmed });
    } else if (!amount) {
      errors.push({ line: i + 1, message: 'invalid or missing amount', raw: trimmed });
    } else {
      entries.push({
        address: recipient,
        amount,
        input: recipient,
      });
    }
  }

  return { entries, errors };
}

export function parseAmountToWei(amount: string, decimals: number): bigint {
  const [whole = '0', fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function formatWei(wei: bigint, decimals: number): string {
  if (wei === 0n) return '0';

  const negative = wei < 0n;
  const absWei = negative ? -wei : wei;
  const str = absWei.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const fraction = str.slice(-decimals);

  // show up to 4 decimal places, trim trailing zeros
  const trimmed = fraction.slice(0, 4).replace(/0+$/, '');
  const result = trimmed ? `${whole}.${trimmed}` : whole;
  return negative ? `-${result}` : result;
}

export function encodeERC20Transfer(to: string, amount: bigint): string {
  // transfer(address,uint256) selector = 0xa9059cbb
  const selector = 'a9059cbb';
  const encodedAddress = to.slice(2).toLowerCase().padStart(64, '0');
  const encodedAmount = amount.toString(16).padStart(64, '0');
  return '0x' + selector + encodedAddress + encodedAmount;
}
