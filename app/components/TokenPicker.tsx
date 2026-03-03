'use client';

import { useState, useRef, useEffect } from 'react';
import type { Token } from '../lib/types';

interface TokenPickerProps {
  tokens: Token[];
  selected: Token | null;
  onSelect: (token: Token) => void;
  isLoading: boolean;
}

export function TokenPicker({ tokens, selected, onSelect, isLoading }: TokenPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase()),
  );

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div className="token-picker" ref={ref}>
      <button
        className="token-picker-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {selected ? (
          <>
            {selected.icon && (
              <img
                src={selected.icon}
                alt={selected.symbol}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span>
              {selected.symbol} — {shortAddr(selected.address)}
            </span>
          </>
        ) : (
          <span>{isLoading ? 'loading tokens…' : 'select a token'}</span>
        )}
        <span className="chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="token-dropdown">
          <input
            className="token-search"
            placeholder="search by name, symbol, or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filtered.length === 0 && (
            <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#999' }}>
              no tokens found
            </div>
          )}
          {filtered.map((token) => (
            <button
              key={token.address}
              className="token-dropdown-item"
              onClick={() => {
                onSelect(token);
                setOpen(false);
                setSearch('');
              }}
              type="button"
            >
              {token.icon && (
                <img
                  src={token.icon}
                  alt={token.symbol}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="token-meta">
                <span className="token-symbol">{token.symbol}</span>
                <span className="token-address">{shortAddr(token.address)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
