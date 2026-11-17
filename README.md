# TrendDip — BTC race bot

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A bot that trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute,
on 1-minute on-chain prices, with $1,000 of paper money. It buys only a deep
hourly dip that has already stabilised and is not inside a 2-hour downtrend —
60-minute return ≤ −100 bps, with 5-minute return ≥ −50 bps, 15-minute return
≥ −15 bps and 120-minute return ≥ −100 bps — in one full-cash order, then
exits at +175 bps take-profit or −60 bps stop, with a 60-bar cooldown after
any exit. At most one open position, long only. Deterministic: a pure function
of the bars the harness sends — no clock, no environment, no randomness.

Dev window (official local grade): net PnL **+33.79 USDC** (mirror; official
grade to be recorded in BUILD-NOTES.md), 2 round trips, max drawdown 0.66%,
guardrails met. Two executions byte-identical.

## Run it

```sh
node main.ts
```

The bot speaks `agent-fun/bars-replay/v1` on stdin/stdout (see the kit's
`protocol.schema.json`). It needs Node 22+ with TypeScript type stripping;
no install step, no dependencies beyond the vendored `vendor/makefun-bars.ts`
(a byte-identical copy of the kit's SDK shim).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
