# Shadow Ledger

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/sanschiko3-dotcom/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/sanschiko3-dotcom/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An original top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

## The game

One thief. One archive. Five guards who never blink. Slip through the
Meridian Archive after dark, steal the **3 ledger pages**, then reach the
**green exit** without being caught.

- **5 patrolling guards** (Rook, Bishop, Knight, Queen, Pawn), each with a
  sweeping **vision cone** that turns yellow → red as suspicion builds
- **Detection with recovery**: get spotted and a guard investigates; break
  line of sight and suspicion fades. Get fully spotted and the guard chases —
  get touched and the run is over
- **Cover that reads at a glance**: bushes hide you, crates and walls block
  sight, dark shadow floor halves how fast you are spotted
- **Sneak (hold Shift)**: slower, quieter, harder to spot; running loud
  draws nearby guards toward the noise
- **HUD**: objective, pages found, alert state, detection meter, timer
- **Synthesised sound**: footsteps (yours and the guards', quieter with
  distance), alert sting, pickup chime, win/lose motifs — no audio files
- **Start / pause / win / lose screens** with a Ghost–Shadow–Prowler rank

## Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Click a floor tile | Walk there |
| Hold Shift | Sneak |
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
`index.html?shot=overview|cone|hide|exit`. A scripted self-test runs at
`index.html?selftest=1` (7 checks: movement, patrol, detection, hiding,
win, lose, level parsing).

## Layout

- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`
- `game/index.html`, `game/style.css` — page shell and HUD
- `game/src/level.js` — the archive floor, collision, line of sight
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/player.js` — movement, sneak, click-to-walk, hiding
- `game/src/audio.js` — synthesised WebAudio sound
- `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — game loop, states, input, HUD, self-test
- `screenshots/` — 4 real renders of the game in a browser
- `vendor/makefun-game.ts` — the kit's library, unchanged

## License

MIT — see [LICENSE](LICENSE).
