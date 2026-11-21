// Shadow Ledger — game controller: states, loop, input, HUD, win/lose, self-test.
// The game is fully playable from this module alone; rendering lives in render.js.
import { parseLevel } from './level.js';
import { Guard, GUARD_DEFS, SUSPICION_MAX } from './guards.js';
import { Player } from './player.js';
import { SoundEngine } from './audio.js';
import { stageShot } from './shots.js';
import {
  drawFloor, drawCratesAndBushes, drawLedgersAndExit,
  drawGuard, drawPlayer, drawParticles, drawVignette,
} from './render.js';
import { clamp, distance } from './rng.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sound = new SoundEngine();

const hudPages = document.getElementById('hud-pages');
const hudAlert = document.getElementById('hud-alert');
const hudMeter = document.getElementById('hud-meter-fill');
const hudTime = document.getElementById('hud-time');
const hudObjective = document.getElementById('hud-objective');
const overlay = document.getElementById('overlay');

const panels = {
  start: document.getElementById('panel-start'),
  win: document.getElementById('panel-win'),
  lose: document.getElementById('panel-lose'),
  pause: document.getElementById('panel-pause'),
};

function showPanel(name) {
  overlay.classList.toggle('hidden', name === null);
  for (const [key, el] of Object.entries(panels)) el.classList.toggle('hidden', key !== name);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function rankFor(time, alerts) {
  if (alerts === 0 && time < 180) return 'Rank: GHOST — never seen, never heard.';
  if (alerts === 0) return 'Rank: SHADOW — unseen from start to finish.';
  if (alerts <= 2) return 'Rank: PROWLER — spotted, but you slipped away.';
  return 'Rank: LOUD SHADOW — the archive knows your name now.';
}

export function createGame() {
  const level = parseLevel();
  const game = {
    level,
    player: new Player(level.spawn),
    guards: GUARD_DEFS.map((def) => new Guard(def)),
    particles: [],
    state: 'menu', // menu | playing | paused | won | lost
    frozen: false, // staged screenshot scenes do not simulate
    time: 0,
    pagesFound: 0,
    alerts: 0,
    wasChase: false,
    keys: { up: false, down: false, left: false, right: false, sneak: false },

    reset() {
      const fresh = parseLevel();
      this.level = fresh;
      this.player = new Player(fresh.spawn);
      this.guards = GUARD_DEFS.map((def) => new Guard(def));
      this.particles.length = 0;
      this.time = 0;
      this.pagesFound = 0;
      this.alerts = 0;
      this.wasChase = false;
      this.frozen = false;
      this.state = 'playing';
    },

    update(dt) {
      if (this.state !== 'playing' || this.frozen) return;
      this.time += dt;
      const onPlayerStep = (x, y, sneaking) => {
        const pan = clamp((x - this.player.x) / 500, -1, 1);
        sound.footstep(pan, sneaking ? 0.05 : 0.12, true);
      };
      const onGuardStep = (x, y) => {
        const d = distance(x, y, this.player.x, this.player.y);
        if (d > 520) return;
        const pan = clamp((x - this.player.x) / 500, -1, 1);
        sound.footstep(pan, 0.16 * (1 - d / 520), false);
      };
      this.player.update(dt, this.keys, onPlayerStep);

      // Running loud draws nearby patrolling guards toward the noise.
      if (this.player.noiseRadius > 0) {
        for (const g of this.guards) {
          if (g.state !== 'patrol') continue;
          if (distance(g.x, g.y, this.player.x, this.player.y) < this.player.noiseRadius) {
            g.state = 'wary';
            g.investigateX = this.player.x;
            g.investigateY = this.player.y;
            g.suspicion = Math.max(g.suspicion, 35);
          }
        }
      }
      for (const g of this.guards) g.update(dt, this.player, onGuardStep);

      const anyChase = this.guards.some((g) => g.state === 'chase');
      if (anyChase && !this.wasChase) {
        this.alerts += 1;
        sound.alertSting();
      }
      this.wasChase = anyChase;

      // Ledger pickups.
      for (const l of this.level.ledgers) {
        if (l.taken) continue;
        if (distance(this.player.x, this.player.y, l.x, l.y) < 28) {
          l.taken = true;
          this.pagesFound += 1;
          sound.pickup();
          for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 90;
            this.particles.push({
              x: l.x, y: l.y,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              life: 0.7, maxLife: 0.7, size: 2 + Math.random() * 2.5, color: '#ffd76a',
            });
          }
        }
      }

      // Exit: only open once every page is stolen.
      if (this.pagesFound === 3) {
        if (distance(this.player.x, this.player.y, this.level.exit.x, this.level.exit.y) < 30) {
          this.state = 'won';
          sound.win();
        }
      }

      // Caught by a chasing guard.
      for (const g of this.guards) {
        if (g.touches(this.player)) {
          this.state = 'lost';
          sound.lose();
          break;
        }
      }

      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
    },

    render() {
      drawFloor(ctx);
      drawCratesAndBushes(ctx, this.level, this.time);
      drawLedgersAndExit(ctx, this.level, this.time);
      for (const g of this.guards) drawGuard(ctx, g, this.time);
      drawPlayer(ctx, this.player, this.time);
      drawParticles(ctx, this.particles);
      drawVignette(ctx);
    },
  };
  return game;
}

const game = createGame();

function syncHud() {
  hudPages.textContent = '📄 ' + game.pagesFound + ' / 3';
  const maxSuspicion = Math.max(0, ...game.guards.map((g) => g.suspicion));
  const worst = game.guards.some((g) => g.state === 'chase')
    ? 'chase'
    : game.guards.some((g) => g.state === 'wary') ? 'wary' : 'calm';
  hudAlert.textContent = worst === 'chase' ? '● ALERTED' : worst === 'wary' ? '● SUSPICIOUS' : '● CALM';
  hudAlert.className = worst === 'chase' ? 'alert-hunt' : worst === 'wary' ? 'alert-wary' : 'alert-calm';
  hudMeter.style.width = clamp(maxSuspicion / SUSPICION_MAX, 0, 1) * 100 + '%';
  hudMeter.style.background = worst === 'chase' ? '#ff5040' : worst === 'wary' ? '#ffbe3c' : '#ffd76a';
  hudTime.textContent = formatTime(game.time);
  hudObjective.textContent = game.pagesFound === 3
    ? 'All pages stolen — reach the green EXIT!'
    : 'Find 3 ledger pages, then reach the exit unseen.';
  if (game.state === 'won') {
    document.getElementById('win-stats').textContent =
      'Out in ' + formatTime(game.time) + ' with ' + game.alerts + (game.alerts === 1 ? ' alarm' : ' alarms') + ' raised.';
    document.getElementById('win-rank').textContent = rankFor(game.time, game.alerts);
    showPanel('win');
  } else if (game.state === 'lost') {
    document.getElementById('lose-stats').textContent =
      'Caught after ' + formatTime(game.time) + ' with ' + game.pagesFound + ' / 3 pages stolen.';
    showPanel('lose');
  }
}

// ---- Input: keyboard + mouse ---------------------------------------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (e) => {
  const mapped = KEYMAP[e.code];
  if (mapped) {
    game.keys[mapped] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    return;
  }
  if (e.code === 'KeyP') togglePause();
  else if (e.code === 'KeyR') restart();
  else if (e.code === 'KeyM') toggleMute();
  else if ((e.code === 'Enter' || e.code === 'Space') && game.state === 'menu') startGame();
});

window.addEventListener('keyup', (e) => {
  const mapped = KEYMAP[e.code];
  if (mapped) game.keys[mapped] = false;
});

canvas.addEventListener('click', (e) => {
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  game.player.walkTarget = {
    x: ((e.clientX - rect.left) / rect.width) * 1280,
    y: ((e.clientY - rect.top) / rect.height) * 800,
  };
  sound.ensure();
});

function startGame() {
  sound.ensure();
  game.reset();
  showPanel(null);
}

function restart() {
  sound.ensure();
  game.reset();
  showPanel(null);
}

function togglePause() {
  if (game.state === 'playing') {
    game.state = 'paused';
    showPanel('pause');
  } else if (game.state === 'paused') {
    game.state = 'playing';
    showPanel(null);
  }
}

function toggleMute() {
  sound.ensure();
  sound.setMuted(!sound.muted);
  document.getElementById('btn-mute').textContent = sound.muted ? '🔇 Muted' : '🔊 Sound';
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-again-win').addEventListener('click', restart);
document.getElementById('btn-again-lose').addEventListener('click', restart);
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-mute').addEventListener('click', toggleMute);

// Report page errors into the DOM so headless checks can see them.
window.addEventListener('error', (e) => {
  const el = document.getElementById('errors');
  el.textContent += 'ERROR: ' + e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '') + '\n';
});
window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('errors');
  el.textContent += 'REJECTION: ' + e.reason + '\n';
});

// ---- Self-test (?selftest=1): scripted checks, results into #selftest -----
function runSelfTest() {
  const results = [];
  const check = (name, fn) => {
    try { results.push({ name, pass: !!fn() }); }
    catch (err) { results.push({ name, pass: false, error: String(err) }); }
  };
  check('level parses with 3 ledgers and an exit', () => {
    const lv = parseLevel();
    return lv.ledgers.length === 3 && !!lv.exit && !!lv.spawn;
  });
  check('player walks right when the key is held', () => {
    const g = createGame();
    g.reset();
    const x0 = g.player.x;
    g.keys.right = true;
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return g.player.x > x0 + 50;
  });
  check('a guard advances along its patrol', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[0];
    const x0 = guard.x;
    const y0 = guard.y;
    for (let i = 0; i < 120; i++) g.update(1 / 60);
    return Math.hypot(guard.x - x0, guard.y - y0) > 20;
  });
  check('suspicion rises when the player stands in a cone', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[4]; // Pawn, patrols open row 6
    guard.x = 10 * 40 + 20; guard.y = 6 * 40 + 20; guard.angle = 0;
    g.player.x = 13 * 40 + 20; g.player.y = 6 * 40 + 20;
    const s0 = guard.suspicion;
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return guard.suspicion > s0 + 10;
  });
  check('a bush hides the player from a distant guard', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[4];
    guard.x = 10 * 40 + 20; guard.y = 6 * 40 + 20; guard.angle = 0;
    g.player.x = 15 * 40 + 20; g.player.y = 3 * 40 + 20; // bush tile
    g.player.hiddenInBush = true;
    const seen = guard.canSee(g.player);
    return seen.seen === false;
  });
  check('reaching the exit with all pages wins', () => {
    const g = createGame();
    g.reset();
    g.level.ledgers.forEach((l) => { l.taken = true; });
    g.pagesFound = 3;
    g.player.x = g.level.exit.x;
    g.player.y = g.level.exit.y;
    g.update(1 / 60);
    return g.state === 'won';
  });
  check('a chasing guard touching the player loses the run', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[0];
    guard.state = 'chase';
    guard.suspicion = 100;
    guard.x = g.player.x + 10;
    guard.y = g.player.y;
    g.update(1 / 60);
    return g.state === 'lost';
  });
  const passed = results.filter((r) => r.pass).length;
  const el = document.getElementById('selftest');
  el.textContent = JSON.stringify({ passed, total: results.length, results });
  document.title = 'SELFTEST ' + (passed === results.length ? 'PASS' : 'FAIL') + ' ' + passed + '/' + results.length;
}

// ---- Boot ------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  showPanel(null);
  if (stageShot(game, shot)) {
    game.render();
    syncHud();
  }
} else {
  showPanel('start');
  game.render();
}
if (params.get('selftest') === '1') runSelfTest();

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const prevState = game.state;
  game.update(dt);
  game.render();
  if (game.state !== prevState || game.state === 'playing') syncHud();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
