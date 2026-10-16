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

Select a tower, then tap a circular mooring on the map. Launch a wave when ready. Tap built towers to upgrade or sell. Each kill earns gold, and each cleared wave earns a bonus. Every boat that reaches the southern gate costs one of your 20 integrity points. Survive all ten waves to win. Pause, 2× speed, reset, optional interface sounds, and in-game instructions are included.

Google Fonts enhances typography when reachable; system serif and sans-serif fallbacks work offline. Boats, towers, and waterfront buildings use a locally served, image-generated Venetian sprite atlas. Terrain, water, wakes, and combat effects are rendered with Canvas. Procedural fallback art keeps the game playable if the atlas fails to load.

## Publish on GitHub Pages

The included GitHub Actions workflow tests and publishes only the static game files and artwork. In the GitHub repository's **Settings → Pages**, set **Source** to **GitHub Actions**. Push to `main` (or run **Deploy Lagoon Guard** manually) to deploy. The project is compatible with a repository subpath such as `/towers/`; no Node server is needed on the host.

Crossbow and cannon towers use separate stationary bases and eight generated weapon directions. Aim follows targets between shots, barrel recoil moves only the weapon, and shot effects begin at the visible muzzle. The Tidekeeper stays fixed and casts from its crystal.

The battlefield and scenery cache render at display resolution (up to 3× pixel density). Paving repeats at a 240-unit tile size for finer cobbles. Bolts and frost shards fly toward their targets; cannonballs follow an arc to a predicted landing point. Damage, splash, and slowing resolve on impact.

The southern city gate is a generated Venetian Arsenal-inspired landmark, with twin brick towers, Istrian stonework, a winged lion, and a transparent canal passage. It renders in front of passing boats; the two nearby moorings are spaced outside its footprint.
