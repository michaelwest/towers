# Lagoon Guard balance

The target is a clearable campaign when players keep investing in a mixture of towers. Opening waves allow learning; the middle and back of the canal become necessary as pressure rises. Balance is measured with the actual engine, including targeting, splash, slowing, projectile flight, overkill, range, upgrades, and kill income.

## Tower maths

Damage per second (DPS) = damage / cooldown. This assumes continuous firing and ignores range downtime and overkill. Cannon DPS is **per enemy caught in each explosion**, not guaranteed total DPS.

| Tower | Cost | Damage | Cooldown | L1 DPS | L2 DPS | L3 DPS | Total cost at L3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Campanile | 65 | 19 | 0.65s | 29.23 | 50.74 | 76.12 | 212 |
| Bombard | 110 | 29 | 1.65s | 17.58 | 30.51 | 45.77 | 358 |
| Tidekeeper | 85 | 6 | 0.95s | 6.32 | 10.96 | 16.45 | 277 |

Each upgrade adds 55% of base damage, 12% of base firing frequency, and 12 range units. The level-2 DPS factor is 1.55 × 1.12 = 1.736; level 3 is 2.1 × 1.24 = 2.604. Upgrade prices are rounded to the nearest gold.

The Bombard does 35.15 / 52.73 effective base DPS when each shot catches two / three boats, respectively. The Tidekeeper's main value is its 48% slow for 2 seconds: one application delays an otherwise unimpeded boat by 0.96 seconds of normal travel. Continuous slowing increases time in range by up to 1 / 0.52 = 1.92×. It prioritises unslowed boats and avoids duplicating frost shots already in flight.

## Enemies and wave budgets

Base HP is 45 / 105 / 240; each wave applies its configured multiplier and rounds HP to the nearest integer. Speed is 69 / 48 / 31 map units per second. Kill rewards are **3 / 5 / 8 gold** for skiffs / raiders / galleons. Starting treasury is 220, and clearing a wave grants **80 gold**, even if some boats escaped. Escaped boats grant no kill reward. The reliable clear bonus funds expansion without requiring perfect early play.

The path is 2333 units long. Before slowing, a full journey takes 33.8 / 48.6 / 75.3 seconds. Actual tower uptime depends on placement; towers never deliver their headline DPS for the entire journey.

| Wave | Skiffs / Raiders / Galleons | HP each (S / R / G) | Total HP | Spawn interval | Kill gold | Clear bonus | Full-clear income |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | 9 / 0 / 0 | 74 / — / — | 666 | 0.95s | 27 | 80 | 107 |
| 2 | 8 / 4 / 0 | 95 / 221 / — | 1,644 | 0.90s | 44 | 80 | 124 |
| 3 | 10 / 6 / 0 | 110 / 257 / — | 2,642 | 0.85s | 60 | 80 | 140 |
| 4 | 8 / 8 / 5 | 119 / 278 / 636 | 6,356 | 0.80s | 104 | 80 | 184 |
| 5 | 10 / 11 / 6 | 131 / 305 / 696 | 8,841 | 0.75s | 133 | 80 | 213 |
| 6 | 14 / 13 / 7 | 144 / 336 / 768 | 11,760 | 0.70s | 163 | 80 | 243 |
| 7 | 16 / 16 / 9 | 158 / 368 / 840 | 15,976 | 0.65s | 200 | 80 | 280 |
| 8 | 19 / 20 / 10 | 169 / 394 / 900 | 20,091 | 0.60s | 237 | 80 | 317 |
| 9 | 23 / 23 / 12 | 207 / 483 / 1104 | 29,118 | 0.55s | 280 | 80 | 360 |
| 10 | 27 / 27 / 14 | 221 / 515 / 1176 | 36,336 | 0.50s | 328 | 80 | 408 |

Enemy count = 9 + 3n + floor(0.4n²), where n = wave − 1. Spawn interval = max(0.5, 0.95 − 0.05n). HP multipliers are a deliberately tuned per-wave table in engine.js; heavier boats first appear on wave 4.

Perfect clears earn 2376 gold, or 2,596 including the initial treasury. Only 2,188 is available before wave 10; its 408-gold reward cannot help defend that wave. The reference ten-tower mix would cost 2,753 to fully upgrade, so the player must choose where to spend rather than max everything.

## Measured campaigns

Run `npm run balance` to reproduce these results. The three explicit layouts are in scripts/balance.mjs. They place towers only between waves, buy a mixture of all three types, expand to ten towers, and start upgrading after reaching eight towers. No selling, mid-wave reinvestment, dynamic difficulty, enemy stat overrides, or perfect target micro is used. Combat runs at a fixed 1/60-second step, as in the browser.

“Furthest” records the greatest path progress of any boat during the wave. Reaching 100% means a leak. This is a spatial safety margin, not a direct damage-capacity percentage.

| Wave | Canal line: furthest | Spread out: furthest | Cannon first: furthest | Escapes, all three |
|---|---:|---:|---:|---:|
| 1 | 37.1% | 51.5% | 41.5% | 0 |
| 2 | 40.2% | 58.5% | 47.1% | 0 |
| 3 | 47.8% | 88.6% | 67.5% | 0 |
| 4 | 62.9% | 85.2% | 68.5% | 0 |
| 5 | 75.6% | 75.6% | 78.4% | 0 |
| 6 | 73.0% | 73.1% | 70.7% | 0 |
| 7 | 84.6% | 72.4% | 71.8% | 0 |
| 8 | 90.8% | 72.2% | 89.3% | 0 |
| 9 | 90.5% | 81.4% | 83.8% | 0 |
| 10 | 75.1% | 92.3% | 94.3% | 0 |

All three strategies clear every boat in all ten waves. Two layouts clear the final threats at 92–94% of the route, leaving about 130–181 map units before the goal; the stronger canal-line layout retains a larger margin. Final pre-wave spare gold is 18 / 52 / 7 gold, compared with over 1,600 in the original canal-line simulation. Stopping investment after the starting defence loses on wave 3.

The original economy paid 9 / 15 / 25 gold per kill and only scaled HP linearly. The reference defence killed the last wave around 47% of the path and ended with 2,673 unspent gold. The revised economy lowers runaway income, preserves early expansion through the clear bonus, and raises the last wave from roughly 22,082 to 36,336 total HP.

Regression tests require all 30 reference waves to clear, reconcile actual income with the budget, require back-line pressure, and reject a passive starting defence. These deterministic simulations establish a baseline; human playtesting should guide subsequent tuning of perceived difficulty and placement tolerance.
