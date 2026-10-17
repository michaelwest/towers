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

The open network has eight routes; the shortest is 1,225 units. Dams can force a journey of up to 2,333 units. On that longest route, before slowing, a full journey takes 33.8 / 48.6 / 75.3 seconds. Actual tower uptime depends on placement; towers never deliver their headline DPS for the entire journey.

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

Perfect clears earn 2376 gold, or 2,596 including the initial treasury. Only 2,188 is available before wave 10; its 408-gold reward cannot help defend that wave. Fully upgrading seven crossbows, two cannons, and one frost tower costs 2,477 gold (2,754 with the optional second frost tower), before the additional 375 gold for three dams. The player must choose where to spend rather than max everything.

## Branching routes and dam costs

Dams cost 125 gold each and refund 81 on removal. At 3.57 times their former price, dams require saving or deferring tower upgrades; the 220-gold opening treasury cannot buy two. Three staggered shortcut crossings can be closed. Each bypasses a separate bend of the main canal, so a single purchase always extends the shortest route, even when other dams have already been built. The original winding backbone cannot be dammed, guaranteeing an open route through every combination.

| Dam | Map position | Extra distance when closed alone | Shortest route afterward |
|---|---|---:|---:|
| Upper shortcut | (310, 176) | 536 (+43.8%) | 1,761 |
| Middle shortcut | (280, 358) | 276 (+22.5%) | 1,501 |
| Lower shortcut | (430, 524) | 296 (+24.2%) | 1,521 |

The initial shortest route is 1,225 units; all three dams restore the 2,333-unit main canal, an increase of 90.4%. Detours add independently. The network starts with eight simple routes. Most boats use the shortest; every third chooses the second-shortest when it is within 50% of the shortest.

Dam purchases validate the full network and each live boat. Complete blockades, trapped boats, and building through an occupied canal are rejected without charging gold. Live boats reroute from their current position. Target priority uses remaining distance to the goal, so a boat on a shortcut is not overlooked merely because it travelled fewer units.

## Measured campaigns

Run `npm run balance` to reproduce these results. The two explicit purchase schedules are in scripts/balance.mjs. They begin with three crossbows for 195 of the starting 220 gold, buy the first dam before wave 4, and use it alone through wave 5. The other dams follow before waves 6 and 7. Purchases happen only between waves. Every purchase must succeed at its actual price; the simulator rejects unaffordable plans. No selling, mid-wave reinvestment, dynamic difficulty, stat overrides, or target micro is used. Combat runs at a fixed 1/60-second step, as in the browser. Enemy HP, wave counts, tower stats, starting gold, and wave income are unchanged.

“Furthest” is the maximum fraction of a boat's own current route traversed during the wave. Reaching 100% means a leak. The opening uses the open network; routes lengthen as dams become affordable.

| Wave | Upgrade finish: furthest | Extra frost: furthest | Escapes, both |
|---|---:|---:|---:|
| 1 | 59.9% | 59.9% | 0 |
| 2 | 69.0% | 69.0% | 0 |
| 3 | 80.0% | 80.0% | 0 |
| 4 | 85.5% | 85.5% | 0 |
| 5 | 79.1% | 79.1% | 0 |
| 6 | 91.7% | 91.7% | 0 |
| 7 | 93.0% | 93.0% | 0 |
| 8 | 90.2% | 90.2% | 0 |
| 9 | 96.0% | 96.0% | 0 |
| 10 | 90.5% | 90.8% | 0 |

Both plans clear every boat in all ten waves while paying 375 gold for three dams. They use the same mixed defence through wave 9, then either invest in existing towers or add a second frost tower at the exit. Their final threats reach 90.5% / 90.8% of the route, with 22 / 65 gold left before the final wave. Wave 9 reaches 96.0%. Keeping only the initial defence eventually loses the campaign.

Regression tests require all 20 reference waves to clear, reconcile actual income with theoretical budgets, account for dam purchases, and apply meaningful pressure to the back line. Routing tests enumerate every dam configuration, require each additional dam to extend the route, and ensure no successful purchase disconnects the gate. Human playtesting should guide further tuning of placement tolerance and perceived difficulty.
