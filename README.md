# Shadow Ledger

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/sanschiko3-dotcom/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/sanschiko3-dotcom/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An original top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

## The game

One thief. Three heists. Guards, cameras, and a vault that never sleeps. Slip
through the Meridian Archive, the Hall of Portraits and the Star Sapphire
Vault — steal the **3 ledger pages** on each floor, grab the **gold**, then
reach the **green exit**. Finish a heist without being caught for a
**+$500 ghost bonus**.

### v3 — built to be read at a glance

- **Vision cones clipped by walls and crates**: every cone is a fan of rays
  that stops at the first solid tile, so cover reads the way it plays —
  a cone that ends at a wall means the floor behind it is safe
- **Guards you can find**: bigger figures ringed in white, name + state
  under each one (`PATROL` / `SUSPICIOUS` / `HUNTED`), `?` and `!` overhead
- **Field notes (H)**: an in-game legend card, dotted patrol routes you can
  learn, and callouts naming what each thing does — the staged screenshots
  show them on
- **Smoke pellet (Q, 2 per heist)**: throw one and its cloud blinds every
  cone it stands between, so you can slip past a camera or break a chase
- **Lighting that shows what is safe**: warm lamp pools where you are easy
  to see, dark shadow floor where you are hard to spot, a gold ring under
  you in lamplight and a blue ring in shadow; the HUD says
  `IN LIGHT` / `IN SHADOW` / `HIDDEN` / `DIM`
- **The Vault re-painted navy**: no more muddy brown — deep blue floors,
  slate walls, gold lamps, like the Archive and the Gallery

- **3 heists, 5 → 7 guards** (Rook, Bishop, Knight, Queen, Pawn, Sage,
  Warden), each with a sweeping **vision cone** that turns yellow → red as
  suspicion builds — later floors patrol faster and denser
- **Security cameras** on the Gallery and the Vault: sweeping cones that
  build an alarm and call the nearest guard to your position when they trip
- **Coin-toss gadget** (C or right-click, 5 per heist): throw a coin and the
  nearest guard walks over to investigate — "WHAT WAS THAT?"
- **Detection with recovery**: get spotted and a guard investigates; break
  line of sight and suspicion fades. Get fully spotted and the guard chases —
  get touched and you lose a **strike** and restart at the door. **3 strikes**
  end the run
- **Loot + score**: pages $100, gold coins $25, ghost bonus $500 per clean
  heist; Ghost–Shadow–Prowler rank at the end
- **Cover that reads at a glance**: bushes hide you, crates and walls block
  sight, dark shadow floor halves how fast you are spotted, warm lamp pools
  mark where you are easy to see
- **Sneak (hold Shift)**: slower, quieter, harder to spot; running loud
  draws nearby guards toward the noise
- **HUD**: heist name, pages, score, coins, strikes, alert state, detection
  meter, timer
- **Synthesised sound**: footsteps (yours and the guards', quieter with
  distance), alert sting, coin clink, pickup chime, win/lose motifs — no
  audio files
- **Start / pause / heist-complete / win / lose screens**

## Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Click a floor tile | Walk there |
| Hold Shift | Sneak |
| C / right-click | Toss a coin to distract a guard |
| Q | Throw a smoke pellet (cones cannot see through smoke) |
| H | Field notes: legend, patrol routes and callouts |
| P | Pause |
| R | Restart |
| M | Mute |

## Play it

Serve `game/` with any static server and open `index.html` in desktop
Chrome — no build step, no network requests, all art drawn in code.

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

Screenshot scenes are staged deterministically from the live game code:
`index.html?shot=overview|cone|hide|exit` — every scene shows the field
notes, patrol routes and callouts. A scripted self-test runs at
`index.html?selftest=1` (16 checks: level parsing, movement, patrol,
detection, hiding, level clear, heist advance, win, strikes, coin distraction,
camera alarm, smoke blocking sight, smoke pellet use, wall-clipped cones,
staged field notes).

## Layout

- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`
- `game/index.html`, `game/style.css` — page shell and HUD
- `game/src/level.js` — the three heist floors, collision, line of sight
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/cameras.js` — sweeping security cameras and their alarm
- `game/src/cones.js` — wall-clipped vision-cone polygons and their colours
- `game/src/lighting.js` — lamp pools and the lit/shadow reading of a position
- `game/src/patrols.js` — dotted patrol routes for the field notes
- `game/src/annotations.js` — the field-notes legend and callouts
- `game/src/gadgets.js` — the coin-toss and smoke-pellet gadgets
- `game/src/player.js` — movement, sneak, click-to-walk, hiding
- `game/src/audio.js` — synthesised WebAudio sound
- `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — game loop, states, input, HUD, self-test
- `screenshots/` — 4 real renders of the game in a browser
- `vendor/makefun-game.ts` — the kit's library, unchanged

## License

MIT — see [LICENSE](LICENSE).
