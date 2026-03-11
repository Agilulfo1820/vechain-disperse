"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useWallet,
  useSendTransaction,
  useConnectModal,
  useProfileModal,
} from "@vechain/vechain-kit";
import { useQueryClient } from "@tanstack/react-query";
import { TokenPicker } from "./TokenPicker";
import {
  parseInput,
  parseAmountToWei,
  formatWei,
  encodeERC20Transfer,
} from "../lib/parse";
import {
  useVetBalance,
  useTokenBalance,
  useTokenRegistry,
  useResolveDomains,
} from "../lib/hooks";
import { isVetDomain } from "../lib/parse";
import { ERC20_TRANSFER_ABI, getNetworkType } from "../lib/constants";
import type { Token, Mode } from "../lib/types";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const TIP_ADDRESS = "0x4fb56d105eaa40b0e45e847b84555587929d4b1a";

const TIP_PRESETS = [
  { label: "50 vet", amount: "50" },
  { label: "100 vet", amount: "100" },
  { label: "500 vet", amount: "500" },
];

export function DisperseApp() {
  const { account, connection, disconnect } = useWallet();
  const { open: openConnect } = useConnectModal();
  const { open: openProfile } = useProfileModal();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("vet");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [inputText, setInputText] = useState("");
  const [tipAmount, setTipAmount] = useState("");

  const isConnected = connection?.isConnected;
  const address = account?.address;
  const networkType = getNetworkType();

  // balances
  const { data: vetBalance, isLoading: vetBalanceLoading } =
    useVetBalance(address);
  const { data: tokenBalance, isLoading: tokenBalanceLoading } =
    useTokenBalance(address, selectedToken?.address);

  // token registry
  const { data: tokens = [], isLoading: tokensLoading } = useTokenRegistry();

  // parse textarea
  const parsed = useMemo(() => parseInput(inputText), [inputText]);

  // resolve .vet domains to 0x addresses
  const { resolvedEntries, unresolved, isResolving } = useResolveDomains(
    parsed.entries,
  );

  // calculate totals
  const decimals = mode === "vet" ? 18 : (selectedToken?.decimals ?? 18);
  const symbol =
    mode === "vet" ? "vet" : (selectedToken?.symbol?.toLowerCase() ?? "token");

  const totalWei = useMemo(() => {
    return resolvedEntries.reduce((sum, entry) => {
      try {
        return sum + parseAmountToWei(entry.amount, decimals);
      } catch {
        return sum;
      }
    }, 0n);
  }, [resolvedEntries, decimals]);

  const balance = mode === "vet" ? (vetBalance ?? 0n) : (tokenBalance ?? 0n);
  const remaining = balance - totalWei;
  const insufficientFunds = resolvedEntries.length > 0 && remaining < 0n;
  const balanceLoading =
    mode === "vet" ? vetBalanceLoading : tokenBalanceLoading;

  // transaction
  const {
    sendTransaction,
    status,
    txReceipt,
    resetStatus,
    isTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: address ?? "",
    onTxConfirmed: () => {
      queryClient.invalidateQueries({ queryKey: ["vet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "disperse_success", {
          token_type: mode,
          token_symbol: symbol,
          recipient_count: resolvedEntries.length,
        });
      }
    },
  });

  // tip transaction
  const {
    sendTransaction: sendTip,
    status: tipStatus,
    txReceipt: tipReceipt,
    resetStatus: resetTipStatus,
    isTransactionPending: isTipPending,
  } = useSendTransaction({
    signerAccountAddress: address ?? "",
    onTxConfirmed: () => {
      queryClient.invalidateQueries({ queryKey: ["vet-balance"] });
    },
  });

  const handleTip = useCallback(async () => {
    if (!tipAmount || isTipPending) return;
    const weiValue = parseAmountToWei(tipAmount, 18);
    if (weiValue <= 0n) return;

    await sendTip([
      {
        to: TIP_ADDRESS,
        value: "0x" + weiValue.toString(16),
        data: "0x",
        comment: `tip ${tipAmount} vet to disperse`,
      },
    ]);
  }, [tipAmount, isTipPending, sendTip]);

  const handleDisperse = useCallback(async () => {
    if (
      resolvedEntries.length === 0 ||
      insufficientFunds ||
      isTransactionPending ||
      unresolved.length > 0
    )
      return;

    const clauses =
      mode === "vet"
        ? resolvedEntries.map((e) => ({
            to: e.address,
            value: "0x" + parseAmountToWei(e.amount, 18).toString(16),
            data: "0x",
            comment: `send ${e.amount} vet to ${e.input !== e.address ? e.input + " " : ""}${shortAddress(e.address)}`,
          }))
        : resolvedEntries.map((e) => ({
            to: selectedToken!.address,
            value: "0x0",
            data: encodeERC20Transfer(
              e.address,
              parseAmountToWei(e.amount, selectedToken!.decimals),
            ),
            comment: `send ${e.amount} ${selectedToken!.symbol} to ${e.input !== e.address ? e.input + " " : ""}${shortAddress(e.address)}`,
            abi: ERC20_TRANSFER_ABI,
          }));

    await sendTransaction(clauses);
  }, [
    resolvedEntries,
    insufficientFunds,
    isTransactionPending,
    unresolved,
    mode,
    selectedToken,
    sendTransaction,
  ]);

  // ---------- connect screen ----------
  if (!isConnected) {
    return (
      <div className="page-wrapper">
        <div className="connect-screen">
          <div className="connect-inner">
            <h1>disperse</h1>
            <p className="connect-tagline">
              <span className="dict-label">verb</span> distribute vet or tokens
              to multiple addresses
            </p>
            <h2 className="connect-heading">connect wallet to get started</h2>
            <button
              className="connect-button"
              onClick={() => openConnect()}
              type="button"
            >
              connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- main form ----------
  const explorerBase =
    networkType === "test"
      ? "https://explore-testnet.vechain.org"
      : "https://explore.vechain.org";

  const canSubmit =
    resolvedEntries.length > 0 &&
    !insufficientFunds &&
    !isTransactionPending &&
    !isResolving &&
    unresolved.length === 0 &&
    parsed.errors.length === 0 &&
    (mode === "vet" || selectedToken !== null);

  return (
    <div className="page-wrapper">
      {/* header */}
      <div className="header">
        <div className="header-left">
          <div className="logo-row">
            <h1>disperse</h1>
          </div>
          <p className="tagline">
            <span className="dict-label">verb</span> distribute vet or tokens to
            multiple addresses
          </p>
        </div>

        <div className="wallet-info">
          <span className="network">
            {networkType === "test" ? "testnet" : "mainnet"}
          </span>
          <button
            className="address"
            onClick={() => openProfile()}
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {address ? shortAddress(address) : ""}
          </button>
          <button
            className="disconnect-link"
            onClick={() => disconnect()}
            type="button"
          >
            disconnect
          </button>
        </div>
      </div>

      {/* mode selector */}
      <div className="mode-selector">
        <span>send </span>
        <button
          className={`mode-option ${mode === "vet" ? "active" : ""}`}
          onClick={() => {
            setMode("vet");
            setSelectedToken(null);
          }}
          type="button"
        >
          vet
        </button>
        <span> or </span>
        <button
          className={`mode-option ${mode === "token" ? "active" : ""}`}
          onClick={() => setMode("token")}
          type="button"
        >
          token
        </button>
      </div>

      {/* token picker */}
      {mode === "token" && (
        <TokenPicker
          tokens={tokens}
          selected={selectedToken}
          onSelect={setSelectedToken}
          isLoading={tokensLoading}
        />
      )}

      {/* balance */}
      <div className="balance-line">
        <span>you have </span>
        <span className="balance-value">
          {balanceLoading ? "…" : formatWei(balance, decimals)} {symbol}
        </span>
        {!balanceLoading && balance === 0n && (
          <span className="hint"> (make sure to add funds)</span>
        )}
      </div>

      {/* textarea */}
      <div className="input-section">
        <p className="section-title">recipients and amounts</p>
        <p className="section-subtitle">
          enter one address (or .vet domain) and amount in {symbol} on each
          line. supports any format.
        </p>
        <textarea
          className="input-textarea"
          placeholder={`0x314ab97b76e39d63c78d5c86c2daf8eaa306b182 3.141592\n0x271bffabd0f79b8bd4d7a1c245b7ec5b576ea98a 1.618033\n0xba12222222228d8ba445958a75a0704d566bf2c8,2.71828`}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (status !== "ready") resetStatus();
          }}
          spellCheck={false}
        />
      </div>

      {/* errors */}
      {parsed.errors.length > 0 && (
        <div className="errors-summary">
          {parsed.errors.map((err) => (
            <p key={err.line}>
              line {err.line}: {err.message}
            </p>
          ))}
        </div>
      )}

      {/* domain resolution status */}
      {isResolving && parsed.entries.some((e) => isVetDomain(e.address)) && (
        <div
          className="tx-status pending"
          style={{ marginBottom: "1rem", marginTop: 0 }}
        >
          resolving .vet domains…
        </div>
      )}
      {unresolved.length > 0 && (
        <div className="errors-summary">
          {unresolved.map((d) => (
            <p key={d}>could not resolve {d}</p>
          ))}
        </div>
      )}

      {/* confirm section */}
      {resolvedEntries.length > 0 && (
        <div className="confirm-section">
          <p className="section-title">confirm</p>

          <table className="confirm-table">
            <thead>
              <tr>
                <th>address</th>
                <th style={{ textAlign: "right" }}>amount</th>
              </tr>
            </thead>
            <tbody>
              {resolvedEntries.map((entry, i) => (
                <tr key={i}>
                  <td className="address-cell">
                    {entry.input !== entry.address ? (
                      <span>
                        <span
                          style={{
                            color: "#1a1a1a",
                            fontFamily: "'Playfair Display', serif",
                            fontStyle: "italic",
                          }}
                        >
                          {entry.input}
                        </span>{" "}
                        <span style={{ color: "#999" }}>
                          {shortAddress(entry.address)}
                        </span>
                      </span>
                    ) : (
                      shortAddress(entry.address)
                    )}
                  </td>
                  <td className="amount-cell">
                    {entry.amount} {symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="confirm-totals">
            <div className="row">
              <span className="label">total</span>
              <span className="value">
                {formatWei(totalWei, decimals)} {symbol}
              </span>
            </div>
            <div className="row">
              <span className="label">your balance</span>
              <span className="value">
                {balanceLoading ? "…" : formatWei(balance, decimals)} {symbol}
              </span>
            </div>
            <div className={`row ${insufficientFunds ? "negative" : ""}`}>
              <span className="label">remaining</span>
              <span className="value">
                {balanceLoading ? "…" : formatWei(remaining, decimals)} {symbol}
              </span>
            </div>
          </div>

          {insufficientFunds && (
            <p className="exceeds-warning">total exceeds balance</p>
          )}
        </div>
      )}

      {/* submit */}
      <button
        className="disperse-button"
        disabled={!canSubmit}
        onClick={handleDisperse}
        type="button"
      >
        {isTransactionPending ? "dispersing…" : "disperse"}
      </button>

      {/* tx status */}
      {status === "success" && txReceipt && (
        <div className="tx-status success">
          done.{" "}
          {(() => {
            const receipt = txReceipt as unknown as Record<string, unknown>;
            const meta = receipt.meta as Record<string, string> | undefined;
            const txId =
              meta?.txID ?? (receipt.txId as string) ?? (receipt.id as string);
            if (!txId) return null;
            return (
              <a
                href={`${explorerBase}/transactions/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                view transaction ↗
              </a>
            );
          })()}
        </div>
      )}
      {/* tip section */}
      {status === "success" && txReceipt && (
        <div className="tip-section">
          <p className="tip-heading">found this useful?</p>
          <p className="tip-subtitle">leave a tip to support the project</p>

          <div className="tip-presets">
            {TIP_PRESETS.map((preset) => (
              <button
                key={preset.amount}
                className={`tip-preset ${tipAmount === preset.amount ? "active" : ""}`}
                onClick={() => {
                  setTipAmount(preset.amount);
                  if (tipStatus !== "ready") resetTipStatus();
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
            <div className="tip-custom">
              <input
                type="text"
                className="tip-input"
                placeholder="custom"
                value={TIP_PRESETS.some((p) => p.amount === tipAmount) ? "" : tipAmount}
                onChange={(e) => {
                  setTipAmount(e.target.value);
                  if (tipStatus !== "ready") resetTipStatus();
                }}
                onFocus={() => {
                  if (TIP_PRESETS.some((p) => p.amount === tipAmount)) {
                    setTipAmount("");
                  }
                }}
              />
              <span className="tip-input-suffix">vet</span>
            </div>
          </div>

          <button
            className="tip-button"
            disabled={!tipAmount || isTipPending || tipStatus === "success"}
            onClick={handleTip}
            type="button"
          >
            {isTipPending ? "sending…" : tipStatus === "success" ? "thank you!" : "send tip"}
          </button>

          {tipStatus === "success" && tipReceipt && (
            <div className="tx-status success" style={{ marginTop: "0.75rem" }}>
              tip sent.{" "}
              {(() => {
                const receipt = tipReceipt as unknown as Record<string, unknown>;
                const meta = receipt.meta as Record<string, string> | undefined;
                const txId =
                  meta?.txID ?? (receipt.txId as string) ?? (receipt.id as string);
                if (!txId) return null;
                return (
                  <a
                    href={`${explorerBase}/transactions/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    view transaction ↗
                  </a>
                );
              })()}
            </div>
          )}
          {tipStatus === "error" && (
            <div className="tx-status error" style={{ marginTop: "0.75rem" }}>
              tip failed. please try again.
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="tx-status error">
          transaction failed. please try again.
        </div>
      )}
      {(status === "pending" || status === "waitingConfirmation") && (
        <div className="tx-status pending">
          {status === "pending"
            ? "sending transaction…"
            : "waiting for confirmation…"}
        </div>
      )}
    </div>
  );
}
