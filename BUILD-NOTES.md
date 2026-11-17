# BTC race 20261117-0603 — @syukuran build record

Anchor (quoted first, before any file write):
makefun anchor e3fdc4b5acad085a65a2604e3e89a6fe2d2aa721 round 34034089

Repo: ~/workspace/makefun-btc-race-1117/engine-syukuran
Account: @syukuran (wallet 74762NBmesesGsfr2TuEk7jauhhRi3kBxqMZKw6dFnE2).
Claim file .makefun/owner.json names this wallet. Muse does NOT hold the
@syukuran keypair and used NO @berkah / @berkahmuse credentials or keypairs
for this entry. Build + local verification only — DO NOT submit via CLI;
the entry is ready for the user to submit via the website (they sign with
their wallet). Git identity (repo-local): Berkah <sukur.sukurjp@gmail.com>

Strategy (TRENDDIP — own design, built LAST after studying both siblings):
- Entry: 60m return <= -100 bps AND 5m return >= -50 bps AND 15m return
  >= -15 bps (selling has abated) AND 120m return >= -100 bps (not in a
  2h downtrend). Full cash, single order, no scale-in.
- Exits: fixed take-profit +175 bps / stop -60 bps from the fill price.
  No trailing stop, no time stop. 60-bar cooldown after any exit.
- Gap minutes (batch with no CBBTC bar) are skipped, never traded on a
  stale close. max_slippage_bps 100.

How it differs from, and improves on, the siblings:
- vs @berkahmuse DeepDipHold (+27.02, 5 trades): same dip insight, but
  (1) a stabilisation filter skips the falling-knife entry (the 1096
  episode, max recovery only +81 bps, which DeepDipHold bought and lost
  on); (2) a 120m trend filter refuses dips inside a falling 2h tape;
  (3) TP +175 instead of +150 captures more of the recovery (episode 1
  ran +236 bps, episode 2 +184 bps); (4) stop -60 instead of -100 caps
  a failed dip sooner. Result: fewer trades (2 round trips vs 5 fills
  counting each side) but every one a winner, +33.14 vs +27.02.
- vs @berkah Wide-Trail Dip Recovery (+6.03, 2 trades, 50% size): full
  size instead of half, fixed TP/stop exits instead of a 100 bps trail
  (the trail gives back too much recovery to chop on this tape), no 30m
  trigger, no time stop, plus the 120m trend filter Wide-Trail lacks.
- Action log differs from both (different entry bars 389/576, different
  exits 513/961): no "identical behaviour" risk.

Research (Python mirror, fill model = fee 4 bps + slippage 2 bps + CP
impact vs open depth; decisions on close, fills at next open):
- Mirror reproduced DeepDipHold at +27.32 (official +27.02) — model valid.
- Rejected: trailing exits (+11 to +24), ratchet-after-TP (+15 to +27),
  partial exits (+12-13, stranded half blocks re-entry), bounce-confirm
  entries (+10-13), drop thresholds 80-120 without the trend filter
  (W15 -13 to -34). Donchian/momentum/EMA-cross/z-score/range (from
  sibling research) all negative on this window.
- Chosen combo on the mirror: W17 +33.79, W15 -8.90 (stop 60). Neighbour
  sensitivity is flat: TP 175-180 same, stop 50-100 same on W17, stab
  (-40..-60, -10..-20) same, drop 100-105 same on W17. TP 185 collapses
  (trade 2 peaks at +184) — TP 175 sits on the plateau with headroom.
- Intra-trade worst dip of the W17 winners: -8 / -15 bps, so the -60
  stop has ~4x headroom over anything a winner showed.

Dev gate (grade-local --driver process, official kit grader):
- Commit 10b4855: net PnL +33.140786 USDC (return +3.314%), 4 trades,
  win rate 1.0, max drawdown 0.6606%, fees 1.627319 USDC, net PnL at 2x
  fees +31.491527, 0 rejected, guardrails met. Two executions
  byte-identical (action_log_sha256
  382102aadc265e0299e33ddc573788bdfb210705b3550a5e9a1f0ecaea46da2a,
  L1 regrade reproduced byte for byte). Mirror predicted +33.79.
- Cross-window (20261115 dev window, official grade, same commit):
  net PnL -8.903121 USDC, 2 trades, win rate 0, max drawdown 1.3137%,
  guardrails met. A falling tape (-400 bps drift) where every dip
  variant loses; the trend filter keeps the loss to one stopped-out
  trade instead of DeepDipHold's -65.26 (mirror).

NOT submitted (by design — @syukuran cannot submit via CLI; user
submits via website). No GitHub repo created yet (parent-side). README
carries only the competition badge; the owner/repo rank+reward badges
must be added at GitHub creation with the real owner/repo. No 429s
encountered. No network calls to make.fun made except reading the
public requirements endpoint for the README template.

Session file:
~/agents/agent-d8700268-f815-46ac-9ede-ac4d78cf7a47/sessions/d8700268-f815-46ac-9ede-ac4d78cf7a47.jsonl
(created in-window; copy in repo/transcripts/ is a snapshot at commit time).
Usage jsonl: to be pulled from muse.db by the parent after this run
completes (rows are written only then).
