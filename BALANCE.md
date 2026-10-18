# Lagoon Guard balance

The target is a clearable campaign when players keep investing in a mixture of towers. Opening waves allow learning; the middle and back of the canal become necessary as pressure rises. Balance is measured with the actual engine, including targeting, splash, slowing, projectile flight, overkill, range, upgrades, and kill income.

## Tower maths

Damage per second (DPS) = damage / cooldown. This assumes continuous firing and ignores range downtime and overkill. Cannon DPS is **per enemy caught in each explosion**, not guaranteed total DPS.

| Tower | Cost | Damage | Cooldown | L1 DPS | L2 DPS | L3 DPS | Total cost at L3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ballista | 65 | 19 | 0.65s | 29.23 | 50.74 | 76.12 | 212 |
| Cannon | 110 | 29 | 1.65s | 17.58 | 30.51 | 45.77 | 358 |
| Freeze | 85 | 6 | 0.95s | 6.32 | 10.96 | 16.45 | 277 |

Each upgrade adds 55% of base damage, 12% of base firing frequency, and 12 range units. The level-2 DPS factor is 1.55 × 1.12 = 1.736; level 3 is 2.1 × 1.24 = 2.604. Upgrade prices are rounded to the nearest gold.

The Cannon does 35.15 / 52.73 effective base DPS when each shot catches two / three boats, respectively. The Freeze's main value is its 48% slow for 2 seconds: one application delays an otherwise unimpeded boat by 0.96 seconds of normal travel. Continuous slowing increases time in range by up to 1 / 0.52 = 1.92×. It prioritises unslowed boats and avoids duplicating frost shots already in flight.

## Enemies and wave budgets

Base HP is 45 / 105 / 240 for the original skiffs / raiders / galleons; each wave applies its configured multiplier and rounds HP to the nearest integer. Their speeds are 69 / 48 / 31 map units per second and kill rewards are **3 / 5 / 8 gold**. Added raiders use the same wave HP multiplier:

| Added type | Base HP | Speed | Kill gold | Trait / counter |
|---|---:|---:|---:|---|
| Ironclad | 150 | 30 | 8 | Resists 65% of bolts; cannons deal full damage |
| Smuggler | 36 | 96 | 4 | Fast and fragile; frost slows it to 49.92 speed |
| Airship | 85 | 36 | 12 | Direct 768-unit flight; crossbows and frost can hit it, cannons cannot; deals 3 gate damage |

Starting treasury is 220, and clearing a wave grants **80 gold**, even if some boats escaped. Escaped boats grant no kill reward. The reliable clear bonus funds expansion without requiring perfect early play.

The open network has eight routes; the shortest is 1,225 units. Dams can force a journey of up to 2,333 units. On that longest route, before slowing, a full journey takes 33.8 / 48.6 / 75.3 seconds. Actual tower uptime depends on placement; towers never deliver their headline DPS for the entire journey.

| Wave | Counts (S / R / G / Iron / Smuggler / Air) | HP multiplier | Total HP | Spawn interval | Kill gold | Clear bonus | Full-clear income |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | 9 / 0 / 0 / 0 / 0 / 0 | 1.65 | 666 | 0.95s | 27 | 80 | 107 |
| 2 | 8 / 4 / 0 / 0 / 0 / 0 | 2.1 | 1,644 | 0.90s | 44 | 80 | 124 |
| 3 | 9 / 6 / 0 / 0 / 1 / 0 | 2.45 | 2,620 | 0.85s | 61 | 80 | 141 |
| 4 | 7 / 8 / 5 / 0 / 1 / 0 | 2.65 | 6,332 | 0.80s | 105 | 80 | 185 |
| 5 | 9 / 11 / 4 / 2 / 1 / 0 | 2.9 | 8,292 | 0.75s | 134 | 80 | 214 |
| 6 | 12 / 12 / 5 / 2 / 2 / 1 | 3.2 | 11,062 | 0.70s | 172 | 80 | 252 |
| 7 | 14 / 16 / 6 / 3 / 2 / 0 | 3.5 | 14,967 | 0.65s | 202 | 80 | 282 |
| 8 | 16 / 19 / 7 / 3 / 3 / 1 | 3.75 | 18,903 | 0.60s | 247 | 80 | 327 |
| 9 | 20 / 23 / 8 / 4 / 3 / 0 | 4.6 | 27,339 | 0.55s | 283 | 80 | 363 |
| 10 | 22 / 27 / 10 / 4 / 4 / 1 | 4.9 | 34,588 | 0.50s | 341 | 80 | 421 |

Enemy count = 9 + 3n + floor(0.4n²), where n = wave − 1. Spawn interval = max(0.5, 0.95 − 0.05n). HP multipliers are a deliberately tuned per-wave table in engine.js; heavier boats first appear on wave 4.

Perfect clears earn 2,416 gold, or 2,636 including the initial treasury. Only 2,215 is available before wave 10; its 421-gold reward cannot help defend that wave. Fully upgrading seven crossbows, two cannons, and one frost tower costs 2,477 gold (2,754 with the optional second frost tower), before the additional 375 gold for three dams. The player must choose where to spend rather than max everything.

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

Run `npm run balance` to reproduce these results. The two explicit purchase schedules are in scripts/balance.mjs. They begin with three crossbows for 195 of the starting 220 gold, buy the first dam before wave 4, and use it alone through wave 5. The other dams follow before waves 6 and 7. Purchases happen only between waves. Every purchase must succeed at its actual price; the simulator rejects unaffordable plans. No selling, mid-wave reinvestment, dynamic difficulty, stat overrides, or target micro is used. Combat runs at a fixed 1/60-second step, as in the browser. Wave counts, tower stats, starting gold and the 80-gold clear bonus are unchanged. Added enemies replace selected existing spawns; Smugglers begin on wave 3, Ironclads on wave 5, and exactly one airship appears on each of waves 6, 8 and 10. The schedules move one back-line upgrade forward to wave 7 to counter the new mix.

“Furthest” is the maximum fraction of a boat's own current route traversed during the wave. Reaching 100% means a leak. The opening uses the open network; routes lengthen as dams become affordable.

| Wave | Upgrade finish: furthest | Extra frost: furthest | Escapes, both |
|---|---:|---:|---:|
| 1 | 59.9% | 59.9% | 0 |
| 2 | 69.0% | 69.0% | 0 |
| 3 | 75.9% | 75.9% | 0 |
| 4 | 85.5% | 85.5% | 0 |
| 5 | 80.0% | 80.0% | 0 |
| 6 | 96.5% | 96.5% | 0 |
| 7 | 88.8% | 88.8% | 0 |
| 8 | 73.8% | 73.8% | 0 |
| 9 | 85.6% | 85.6% | 0 |
| 10 | 90.8% | 89.4% | 0 |

Both plans clear every raider in all ten waves while paying 375 gold for three dams. They use the same mixed defence through wave 9, then either invest in existing towers or add a second frost tower at the exit. Final threats reach 90.8% / 89.4% of their own route, with 49 / 43 gold left before the final wave. Wave 6 reaches 96.5%, so the mid-campaign is also pressured. Keeping only the initial defence eventually loses the campaign.

Armour makes raw HP totals incomplete: a 150-HP Ironclad requires 428.6 raw bolt damage, compared with 150 cannon damage. A base crossbow delivers 10.23 DPS against it rather than 29.23; a cannon retains 17.58 DPS per enemy hit. Airship route length is independent of dams; closing canals changes neither flight progress nor position. Its higher gate damage cannot be avoided by finishing a wave with it still in the air. The tests require complete clears of all six enemy types and reconcile their actual rewards.

Regression tests require all 20 reference waves to clear, reconcile actual income with theoretical budgets, account for dam purchases, and apply meaningful pressure to the back line. Routing tests enumerate every dam configuration, require each additional dam to extend the route, and ensure no successful purchase disconnects the gate. Human playtesting should guide further tuning of placement tolerance and perceived difficulty.
