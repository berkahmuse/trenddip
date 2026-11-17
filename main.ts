// TrendDip — a trend-filtered dip bot for cbBTC (CBBTC/USDC).
//
// Thesis: a 60-minute drop of 100 bps or more is only a buyable dislocation
// when two things are true at the same time. First, the selling has stopped:
// the last 5 minutes are no worse than -50 bps and the last 15 minutes no
// worse than -15 bps, so the bot never catches a falling knife mid-plunge.
// Second, the wider tape is not in a downtrend: the 120-minute return is no
// worse than -100 bps. A deep hourly drop inside a flat or rising two-hour
// tape mean-reverts; the same drop inside a falling two-hour tape is just
// the trend, and buying it is how a dip bot bleeds out over a falling day.
//
// The exits are fixed levels from the fill price, not a trail: on this tape
// a trailing stop gives back too much of the recovery to chop (a 100 bps
// trail armed at +50 returned less than a fixed +175 target on the dev
// window), and a partial exit strands half the position and blocks the next
// entry. So the bot takes +175 bps when the recovery gets there and cuts the
// trade at -60 bps when it does not. The -60 stop is about four times the
// worst post-entry dip the dev window's winners ever showed (-15 bps), so it
// rarely touches a trade that would have won, while capping a failed dip at
// roughly twice the round-trip cost. One full-cash order per episode, one
// open position, long only, no leverage, no scale-in, no martingale. After
// any exit the bot rests 60 bars before it may enter again.
//
// The whole decision is a pure function of the bars and fills the harness
// sends: no wall clock, no network, no randomness, no files. Two runs on
// the same data reply byte for byte the same.

import { runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const BPS = 10_000n;

// --- entry: a deep hourly drop, stabilised, outside a 2h downtrend ---
const HISTORY_BARS = 241; // closes needed: 120m lookback plus the current bar
const DROP_60_BPS = -100; // 60-minute return, in bps
const STAB_5_BPS = -50; // 5-minute return must be no worse than this
const STAB_15_BPS = -15; // 15-minute return must be no worse than this
const TREND_120_BPS = -100; // 120-minute return must be no worse than this

// --- exits, measured from the fill price ---
const TAKE_PROFIT_BPS = 175;
const STOP_BPS = -60;
const COOLDOWN_BARS = 60;

// --- execution ---
const MAX_SLIPPAGE_BPS = 100; // 1% past the latest close; fills move ~10 bps

type Phase =
  | 'flat' // no position, may enter
  | 'buySent' // buy ordered, awaiting its fill
  | 'held' // position open
  | 'sellSent'; // sell ordered, awaiting its fill

let closes: bigint[] = []; // closes, oldest first, capped at HISTORY_BARS
let phase: Phase = 'flat';
let entryPrice: bigint = 0n; // fill price of the buy, at price_scale
let cooldown = 0;

function retBps(now: bigint, then: bigint): bigint {
  // (now - then) / then in bps, truncated toward zero.
  return ((now - then) * BPS) / then;
}

function lookbackBps(offsetBars: number): bigint | null {
  // Return of the latest close vs the close `offsetBars` bars ago, or null.
  const n = closes.length;
  if (n <= offsetBars) return null;
  return retBps(closes[n - 1]!, closes[n - 1 - offsetBars]!);
}

await runBars({
  onBatch(state: BarsState, batch: { bars: Bar[]; fills: { client_id: string; side: 'buy' | 'sell'; status: 'filled' | 'rejected'; price: string }[] }): (BuyInput | SellInput)[] {
    // Fold this batch's fills into the phase machine first.
    for (const fill of batch.fills) {
      if (fill.side === 'buy' && phase === 'buySent') {
        if (fill.status === 'filled') {
          phase = 'held';
          entryPrice = BigInt(fill.price);
        } else {
          phase = 'flat';
        }
      } else if (fill.side === 'sell' && phase === 'sellSent') {
        if (fill.status === 'filled') {
          phase = 'flat';
          entryPrice = 0n;
          cooldown = COOLDOWN_BARS;
        } else {
          phase = 'held';
        }
      }
    }
    if (cooldown > 0) cooldown -= 1;

    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar === undefined) return [];
    closes.push(BigInt(bar.c));
    if (closes.length > HISTORY_BARS) closes.shift();

    if (state.warmingUp) return [];
    const close = BigInt(bar.c);

    if (phase === 'flat' && cooldown === 0 && closes.length === HISTORY_BARS) {
      const r60 = lookbackBps(60);
      const r5 = lookbackBps(5);
      const r15 = lookbackBps(15);
      const r120 = lookbackBps(120);
      const deepDrop = r60 !== null && r60 <= BigInt(DROP_60_BPS);
      const stabilised =
        (r5 === null || r5 >= BigInt(STAB_5_BPS)) &&
        (r15 === null || r15 >= BigInt(STAB_15_BPS));
      const notDowntrend = r120 === null || r120 >= BigInt(TREND_120_BPS);
      if (deepDrop && stabilised && notDowntrend && state.cash >= BigInt(state.hello.fees.min_notional_quote_units)) {
        phase = 'buySent';
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS, client_id: `dip-${state.seq}` }];
      }
      return [];
    }

    if (phase === 'held' && entryPrice > 0n) {
      const pos = state.positions.get(SYMBOL);
      if (pos === undefined || pos.qty === 0n) {
        // The position is gone (flattened by the harness): back to flat.
        phase = 'flat';
        entryPrice = 0n;
        return [];
      }
      const ret = retBps(close, entryPrice);
      if (ret >= BigInt(TAKE_PROFIT_BPS) || ret <= BigInt(STOP_BPS)) {
        phase = 'sellSent';
        return [{ side: 'sell', symbol: SYMBOL, qty: pos.qty, max_slippage_bps: MAX_SLIPPAGE_BPS, client_id: `exit-${state.seq}` }];
      }
    }

    return [];
  },
});
