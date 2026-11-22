// All canvas drawing: floor, walls, cover, vision cones, guards, cameras,
// player, effects. Art is drawn in code only — no image files.
import { TILE, COLS, ROWS, tileAt } from './level.js';
import { VISION_RANGE, VISION_HALF_ANGLE } from './guards.js';
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './cameras.js';
import { conePolygon, drawConeShape, coneColorFor } from './cones.js';
import { SMOKE_RADIUS, SMOKE_DURATION } from './gadgets.js';
import { mulberry32, clamp } from './rng.js';

const floorShade = [];
{
  const rand = mulberry32(20261121);
  for (let row = 0; row < ROWS; row++) {
    floorShade[row] = [];
    for (let col = 0; col < COLS; col++) floorShade[row][col] = rand();
  }
}

const DEFAULT_PALETTE = { floorA: '#141a29', floorB: '#151c2c', wall: '#232c40', wallTop: '#2f3c58', wallBottom: '#1a2233', shadow: '#0d1322' };

export function drawFloor(ctx, palette = DEFAULT_PALETTE) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      const x = col * TILE;
      const y = row * TILE;
      const v = floorShade[row][col];
      if (t === '#') {
        ctx.fillStyle = palette.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = palette.wallTop;
        ctx.fillRect(x, y, TILE, 6);
        ctx.fillStyle = palette.wallBottom;
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
      } else if (t === 'D') {
        ctx.fillStyle = palette.shadow;
        ctx.fillRect(x, y, TILE, TILE);
      } else {
        ctx.fillStyle = v < 0.5 ? palette.floorA : palette.floorB;
        ctx.fillRect(x, y, TILE, TILE);
        // Warm speckle on a few tiles, so the floor reads as stone and
        // wood rather than flat dark paint.
        if (v > 0.86) {
          ctx.fillStyle = 'rgba(255,200,120,0.035)';
          ctx.fillRect(x, y, TILE, TILE);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
      if (t === 'D') {
        ctx.fillStyle = 'rgba(90,140,255,0.05)';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}

export function drawCratesAndBushes(ctx, level, time) {
  for (const c of level.crates) {
    ctx.fillStyle = '#4a3a22';
    ctx.fillRect(c.x - 17, c.y - 17, 34, 34);
    ctx.strokeStyle = '#6b5636';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x - 17, c.y - 17, 34, 34);
    ctx.beginPath();
    ctx.moveTo(c.x - 17, c.y - 17);
    ctx.lineTo(c.x + 17, c.y + 17);
    ctx.moveTo(c.x + 17, c.y - 17);
    ctx.lineTo(c.x - 17, c.y + 17);
    ctx.stroke();
  }
  for (const b of level.bushes) {
    const sway = Math.sin(time * 1.4 + b.col * 1.7 + b.row) * 1.5;
    ctx.fillStyle = '#1d4023';
    for (let i = 0; i < 5; i++) {
      const ox = [-13, -6, 3, 10, 0][i];
      const oy = [-8, 6, -11, 4, 10][i];
      ctx.beginPath();
      ctx.arc(b.x + ox + sway * 0.4, b.y + oy, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2c5c33';
    for (let i = 0; i < 4; i++) {
      const ox = [-9, 2, 8, -2][i];
      const oy = [-4, -8, 2, 7][i];
      ctx.beginPath();
      ctx.arc(b.x + ox + sway * 0.4, b.y + oy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawLedgersAndExit(ctx, level, time) {
  for (const l of level.ledgers) {
    if (l.taken) continue;
    const pulse = 0.6 + Math.sin(time * 3 + l.col) * 0.25;
    const glow = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 30);
    glow.addColorStop(0, 'rgba(255,215,106,' + (0.5 * pulse) + ')');
    glow.addColorStop(1, 'rgba(255,215,106,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(l.x - 30, l.y - 30, 60, 60);
    ctx.save();
    ctx.translate(l.x, l.y + Math.sin(time * 2 + l.col) * 2);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#f4e9c8';
    ctx.fillRect(-8, -11, 16, 22);
    ctx.strokeStyle = '#8a7a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -11, 16, 22);
    ctx.strokeStyle = '#5a4d2a';
    ctx.beginPath();
    ctx.moveTo(-5, -5); ctx.lineTo(5, -5);
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(-5, 5); ctx.lineTo(2, 5);
    ctx.stroke();
    ctx.restore();
  }
  const e = level.exit;
  const open = level.ledgers.every((l) => l.taken);
  const pulse = 0.5 + Math.sin(time * 2.5) * 0.2;
  if (open) {
    const glow = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, 64);
    glow.addColorStop(0, 'rgba(123,228,149,' + (0.4 * pulse + 0.2) + ')');
    glow.addColorStop(1, 'rgba(123,228,149,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(e.x - 64, e.y - 64, 128, 128);
  }
  ctx.fillStyle = open ? 'rgba(123,228,149,' + pulse + ')' : 'rgba(224,90,78,' + (pulse * 0.6) + ')';
  ctx.fillRect(e.x - 23, e.y - 23, 46, 46);
  ctx.fillStyle = open ? '#12351d' : '#3a1414';
  ctx.fillRect(e.x - 17, e.y - 17, 34, 34);
  ctx.fillStyle = open ? '#7be495' : '#e05a4e';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', e.x, e.y + 1);
  ctx.strokeStyle = open ? '#7be495' : '#e05a4e';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(e.x - 23, e.y - 23, 46, 46);
}

// Optional loot: small gold coins worth $25 each.
export function drawGoldCoins(ctx, level, time) {
  for (const coin of level.gold) {
    if (coin.taken) continue;
    const pulse = 0.55 + Math.sin(time * 3 + coin.col * 2) * 0.25;
    const glow = ctx.createRadialGradient(coin.x, coin.y, 2, coin.x, coin.y, 22);
    glow.addColorStop(0, 'rgba(255,200,60,' + (0.45 * pulse) + ')');
    glow.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(coin.x - 22, coin.y - 22, 44, 44);
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87c1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#a87c1a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5 + 0.5);
  }
}

export function drawGuard(ctx, guard, time) {
  // Vision cone, clipped by walls and crates: what the guard can actually see.
  const points = conePolygon(guard.x, guard.y, guard.angle, VISION_HALF_ANGLE, VISION_RANGE);
  drawConeShape(ctx, points, coneColorFor(guard.state));

  // Body: a guard in a dark uniform with a cap, facing `angle` — big enough
  // to read at a glance, ringed in white against the floor.
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = 'rgba(232,238,251,0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(8, -6, 11, 12); // cap brim / visor direction
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(14, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Suspicion: a bar and a "!" over the head once the guard notices something.
  if (guard.suspicion > 4) {
    const w = 44;
    const frac = clamp(guard.suspicion / 100, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(guard.x - w / 2, guard.y - 38, w, 7);
    ctx.fillStyle = guard.state === 'chase' ? '#ff5040' : guard.state === 'wary' ? '#ffbe3c' : '#ffd76a';
    ctx.fillRect(guard.x - w / 2, guard.y - 38, w * frac, 7);
    if (guard.state !== 'patrol') {
      ctx.fillStyle = guard.state === 'chase' ? '#ff5040' : '#ffbe3c';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 40);
    }
  }
  // Floating callout while the guard investigates a thrown coin.
  if (guard.labelTimer > 0 && guard.labelText) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(guard.labelText, guard.x, guard.y - 52);
  }
  // Name + state, so the thief can read who is coming and what they are doing.
  const stateWord = guard.state === 'chase' ? 'HUNTED' : guard.state === 'wary' ? 'SUSPICIOUS' : 'PATROL';
  ctx.fillStyle = 'rgba(223,230,242,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(guard.name, guard.x, guard.y + 21);
  ctx.fillStyle = guard.state === 'chase' ? '#ff8a7a' : guard.state === 'wary' ? '#ffbe3c' : 'rgba(159,176,201,0.9)';
  ctx.font = '10px sans-serif';
  ctx.fillText(stateWord, guard.x, guard.y + 35);
}

// Security cameras: wall mount, sweeping pale cone, red flash when tripped.
// The cone is clipped by walls like a guard's, so cover reads the same way.
export function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const alarming = cam.flash > 0;
    const rgb = alarming ? '255,70,50' : '170,220,255';
    const ox = cam.x + Math.cos(cam.angle) * 24;
    const oy = cam.y + Math.sin(cam.angle) * 24;
    const points = conePolygon(ox, oy, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE);
    drawConeShape(ctx, points, rgb, alarming ? 0.24 : 0.14);
    // Mount + lens.
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#2a3140';
    ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = alarming ? '#ff5040' : '#9fd8ff';
    ctx.beginPath();
    ctx.arc(8, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Alarm bar while the camera is building a spot.
    if (cam.alarm > 4) {
      const w = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(cam.x - w / 2, cam.y - 26, w, 5);
      ctx.fillStyle = alarming ? '#ff5040' : '#9fd8ff';
      ctx.fillRect(cam.x - w / 2, cam.y - 26, w * clamp(cam.alarm / 100, 0, 1), 5);
    }
  }
}

// The thrown coin: a spinning dot in flight, an expanding ring once landed.
export function drawCoinToss(ctx, coin, time) {
  if (!coin.active) return;
  if (!coin.landed) {
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87c1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  const age = 2.2 - coin.ringTimer;
  const phase = age / 2.2;
  ctx.strokeStyle = 'rgba(255,207,77,' + (0.7 * (1 - phase)) + ')';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(coin.targetX, coin.targetY, 10 + phase * 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffcf4d';
  ctx.beginPath();
  ctx.arc(coin.targetX, coin.targetY, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPlayer(ctx, player, time, visibility = 'dim') {
  // The thief must be findable at a glance: a soft glow behind them, a
  // bright rim, and a YOU tag like the guards' name tags. The ring under
  // the thief reads how lit they are in every state — gold in lamplight,
  // blue in shadow, soft white in dim light, green while hidden.
  const hidden = player.hiddenInBush;
  const ringColor = hidden ? 'rgba(123,228,149,0.85)'
    : visibility === 'lit' ? 'rgba(255,215,106,0.7)'
    : visibility === 'shadow' ? 'rgba(120,170,255,0.65)'
    : 'rgba(232,238,251,0.4)';
  const glow = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 38);
  glow.addColorStop(0, 'rgba(160,220,255,0.20)');
  glow.addColorStop(1, 'rgba(160,220,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(player.x - 38, player.y - 38, 76, 76);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
  ctx.stroke();
  // Noise ring while walking loud.
  if (player.moving && !player.sneaking) {
    const phase = (time * 2.4) % 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * (1 - phase)) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18 + phase * 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.globalAlpha = hidden ? 0.85 : 1;
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  // Hooded cloak: dark teal body with a lighter hood, gold trim, and a
  // facing wedge so the direction the thief looks reads at a glance.
  ctx.fillStyle = '#0f3d33';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#17604f';
  ctx.beginPath();
  ctx.arc(-2, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 20, -1.1, 1.1);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(10, -7);
  ctx.lineTo(10, 7);
  ctx.closePath();
  ctx.fill();
  // Face shadow with two bright eyes.
  ctx.fillStyle = '#0a1f1a';
  ctx.beginPath();
  ctx.arc(7, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8eefb';
  ctx.beginPath();
  ctx.arc(8, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(8, 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Bright rim, drawn at full strength even in a bush: the thief is hidden
  // from the guards, never from the reader.
  ctx.strokeStyle = 'rgba(207,238,255,0.95)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 21, 0, Math.PI * 2);
  ctx.stroke();
  // YOU tag + state, mirroring the guards' name + state tags.
  const stateWord = hidden ? 'HIDDEN' : player.sneaking ? 'SNEAKING'
    : visibility === 'lit' ? 'IN LIGHT' : visibility === 'shadow' ? 'IN SHADOW' : 'DIM';
  const stateColor = hidden ? '#7be495' : visibility === 'lit' ? '#ffd76a'
    : visibility === 'shadow' ? '#8fb8ff' : 'rgba(159,176,201,0.95)';
  ctx.fillStyle = 'rgba(232,238,251,0.95)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('YOU', player.x, player.y + 27);
  ctx.fillStyle = stateColor;
  ctx.font = '10px sans-serif';
  ctx.fillText(stateWord, player.x, player.y + 41);
}

// The smoke pellet: a small pellet in flight, then a grey-blue cloud no
// vision cone can see through. Fixed puffs, so a frozen scene renders the
// same cloud every time.
export function drawSmoke(ctx, smoke, time) {
  if (!smoke.active) return;
  if (!smoke.landed) {
    ctx.fillStyle = '#c8cfdd';
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const fade = clamp(smoke.timer / SMOKE_DURATION, 0, 1);
  const puffs = [
    [0, 0, 34], [-26, -12, 26], [26, -14, 28], [-18, 20, 24], [22, 18, 26], [0, -26, 22],
  ];
  for (const [ox, oy, r] of puffs) {
    const wobble = Math.sin(time * 1.3 + ox) * 2;
    ctx.fillStyle = 'rgba(158,170,196,' + (0.5 * fade) + ')';
    ctx.beginPath();
    ctx.arc(smoke.x + ox + wobble, smoke.y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(220,228,242,' + (0.55 * fade) + ')';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(640, 400, 320, 640, 400, 760);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 800);
}
