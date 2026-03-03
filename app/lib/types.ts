export interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  icon: string;
  desc?: string;
}

export type Mode = 'vet' | 'token';

export interface ParsedEntry {
  address: string;
  amount: string;
  /** Original input — may be a .vet domain before resolution */
  input: string;
}

export interface ParseError {
  line: number;
  message: string;
  raw: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  errors: ParseError[];
}
