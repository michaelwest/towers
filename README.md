# Lagoon Guard

A mobile-friendly, Venetian canal tower defence game. Defend the city through ten waves with precision, splash, and slowing towers. Built with Canvas and vanilla JavaScript; no dependencies, account, or backend service required.

## Run

Requires Node.js 18 or newer.

```sh
npm start
```

The server listens on all interfaces at port 3000. Set `PORT` to change it. Open the server address on a phone connected to the same network or through your development host's port forwarding.

```sh
npm test
```

Tests cover combat, economy, tower upgrades, slowing and splash effects, wave completion, and loss/win conditions.

## Play

Select a tower, then tap a circular mooring on the map. Launch a wave when ready. Tap built towers to upgrade or sell. Each kill earns gold, and each cleared wave earns a bonus. Water raiders cost one integrity point on reaching the gate; an airship costs three. Tap a raider to inspect its traits and counters. Survive all ten waves to win. Pause, 2× speed, and reset are included.

Google Fonts enhances typography when reachable; system serif and sans-serif fallbacks work offline. Boats, towers, and waterfront buildings use a locally served, image-generated Venetian sprite atlas. Terrain, water, wakes, and combat effects are rendered with Canvas. Procedural fallback art keeps the game playable if the atlas fails to load.

## Publish on GitHub Pages

The included GitHub Actions workflow tests and publishes only the static game files and artwork. In the GitHub repository's **Settings → Pages**, set **Source** to **GitHub Actions**. Push to `main` (or run **Deploy Lagoon Guard** manually) to deploy. The project is compatible with a repository subpath such as `/towers/`; no Node server is needed on the host.

Crossbow and cannon towers use separate stationary bases and eight generated weapon directions. Aim follows targets between shots, barrel recoil moves only the weapon, and shot effects begin at the visible muzzle. The Freeze stays fixed and casts from its crystal.

The battlefield and scenery cache render at display resolution (up to 3× pixel density). Smooth limestone paving repeats at a 160-unit tile size with faint seams and a lighter palette. Bolts and frost shards fly toward their targets; cannonballs follow an arc to a predicted landing point. Damage, splash, and slowing resolve on impact.

The southern city gate is a generated Venetian Arsenal-inspired landmark, with twin brick towers, Istrian stonework, a winged lion, and a transparent canal passage. It renders in front of passing boats; the two nearby moorings are spaced outside its footprint.

Waves increase from 9 boats in the first wave to 68 in the tenth, with accelerating enemy-count growth and spawn intervals tightening from 0.95 to 0.5 seconds. Enemy health and heavier boat types also increase across the campaign.

## Game balance

Run `npm run balance` for tower DPS, enemy HP and counts, gold budgets, and full-engine simulations of two mixed-tower purchase plans. See [BALANCE.md](BALANCE.md) for the maths, measured clear margins, and tuning assumptions. Combat advances in fixed 1/60-second steps so phone frame rate does not change tower DPS.

## Branching canals and dams

The map begins with eight routes through three staggered shortcuts, each bypassing a different bend. Every dam adds its own detour, without needing a matching dam on another vertical canal. Boats choose a short open route, with every third boat taking a nearby alternative when available. Select **Dam**, then tap a marked crossing to close it for 125 gold. The preview shows the shortest remaining route. Dam placement checks entrance connectivity and each live boat, rejects occupied canals, and reroutes boats from their current positions. Click a built dam to reopen it for an 81-gold refund. Closing all three shortcuts restores the original 2,333-unit winding route; leaving them open permits a 1,225-unit route.

The balance simulations now include dam purchases, with no change to starting gold, wave health, income, or tower stats.

## City scenery

The generated district atlas adds nine scenery types: dense homes, Gothic palazzi, warehouses, market stalls, well piazzas, courtyard gardens, single townhouses, artisan workshops, and civic halls. A deterministic layout packs 69 parcels across the dry land, with open markets and gardens contrasting with denser residential blocks. Canal water, dam crossings, tower moorings, the basilica, and the Arsenal gate have reserved clearance. The scenery is composited once into the high-resolution background cache and rebuilt only when assets load or the viewport changes.

Dams use a generated oak-and-bronze sluice sprite with pale stone piers and a winding wheel, shared by the battlefield and purchase card. The lighter limestone background replaces the rough mossy cobbles to reduce visual noise behind the city.

## Raider types and combat feedback

The first two waves introduce skiffs and raiders; galleons arrive on wave 4. Fast, fragile **Smugglers** arrive on wave 3; use frost to hold them in range and crossbows to track them. **Ironclads** arrive on wave 5: their riveted hulls resist 65% of bolt damage, while cannon blasts bypass the armour. **Airships** appear once each on waves 6, 8 and 10. They fly directly to the Arsenal, ignore canals and dams, take three integrity on arrival, and can be targeted by crossbows and frost. Ground-only cannons cannot target or splash them.

All five watercraft use four separately generated views (east, south, west, north) with a fixed elevated camera. Rendering switches direction at canal turns, keeping masts and sails upright; hull pivots are anchored independently of their source crop. The airship has a dedicated frontal view aligned with its direct approach and renders above buildings, towers, dams and the gate, with a detached ground shadow.

Combat feedback includes brief white hit flashes, silver sparks on armour, cannon blast rings and smoke, frost halos with ice crystals, sinking debris and airborne destruction bursts. Gate hits throw dust and show lost integrity; cracks, soot and embers persist as the Arsenal takes damage. Effects follow simulation time and pause with the game. Reduced-motion preferences suppress continuously animated wakes, bobbing and smoke drift. Counter hints appear briefly when a new raider type first enters, and can be recalled by tapping a raider; tower descriptions and cards identify anti-air capability.

## Tower upgrades

Tap any part of a built tower, including its roof or weapon, to manage it during a wave. Towers take selection priority over overlapping raiders. The full-width upgrade button has a 52-pixel touch target and shows the next level and gold cost. A comparison table shows current and next damage per hit, shots per second, range and DPS per target; a shortfall message explains when more gold is needed. Frost slow strength/duration and cannon blast radius stay unchanged. Displayed values and actual combat use the same stat calculation.

Raider HP bars and status icons render in a final foreground pass above docks, towers, the Arsenal gate and combat effects.
