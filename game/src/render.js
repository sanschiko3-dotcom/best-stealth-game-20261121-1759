// All canvas drawing: floor, walls, cover, vision cones, guards, cameras,
// player, effects. Art is drawn in code only — no image files.
import { TILE, COLS, ROWS, tileAt } from './level.js';
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
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
      if (t === 'D') {
        ctx.fillStyle = 'rgba(90,140,255,0.05)';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}

// Warm lamp pools: light that marks where you are easy to see.
export function drawLamps(ctx, level, time) {
  for (const lamp of level.lamps) {
    const flicker = 0.85 + Math.sin(time * 2.1 + lamp.x * 0.05) * 0.06;
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 95);
    glow.addColorStop(0, 'rgba(255,196,110,' + (0.16 * flicker) + ')');
    glow.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lamp.x - 95, lamp.y - 95, 190, 190);
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,160,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 8, 0, Math.PI * 2);
    ctx.stroke();
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
  ctx.fillStyle = open ? 'rgba(123,228,149,' + pulse + ')' : 'rgba(224,90,78,' + (pulse * 0.6) + ')';
  ctx.fillRect(e.x - 19, e.y - 19, 38, 38);
  ctx.fillStyle = open ? '#12351d' : '#3a1414';
  ctx.fillRect(e.x - 14, e.y - 14, 28, 28);
  ctx.fillStyle = open ? '#7be495' : '#e05a4e';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', e.x, e.y + 1);
  ctx.strokeStyle = open ? '#7be495' : '#e05a4e';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 19, e.y - 19, 38, 38);
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
    ctx.arc(coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87c1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#a87c1a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', coin.x, coin.y + Math.sin(time * 2 + coin.col) * 1.5 + 0.5);
  }
}

export function drawGuard(ctx, guard, time) {
  const range = 185;
  const half = Math.PI / 5.2;
  const stateColor =
    guard.state === 'chase' ? 'rgba(255,70,50,' : guard.state === 'wary' ? 'rgba(255,190,60,' : 'rgba(255,220,110,';
  const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, range);
  grad.addColorStop(0, stateColor + '0.34)');
  grad.addColorStop(1, stateColor + '0.05)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.angle - half, guard.angle + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stateColor + '0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.angle - half, guard.angle + half);
  ctx.closePath();
  ctx.stroke();

  // Body: a guard in a dark uniform with a cap, facing `angle`.
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(6, -5, 9, 10); // cap brim / visor direction
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(11, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Suspicion: a bar and a "!" over the head once the guard notices something.
  if (guard.suspicion > 4) {
    const w = 34;
    const frac = clamp(guard.suspicion / 100, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, w, 6);
    ctx.fillStyle = guard.state === 'chase' ? '#ff5040' : guard.state === 'wary' ? '#ffbe3c' : '#ffd76a';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, w * frac, 6);
    if (guard.state !== 'patrol') {
      ctx.fillStyle = guard.state === 'chase' ? '#ff5040' : '#ffbe3c';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 32);
    }
  }
  // Floating callout while the guard investigates a thrown coin.
  if (guard.labelTimer > 0 && guard.labelText) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(guard.labelText, guard.x, guard.y - 44);
  }
  ctx.fillStyle = 'rgba(223,230,242,0.75)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(guard.name, guard.x, guard.y + 17);
}

// Security cameras: wall mount, sweeping pale cone, red flash when tripped.
export function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const range = 210;
    const half = Math.PI / 6.5;
    const alarming = cam.flash > 0;
    const coneColor = alarming ? 'rgba(255,70,50,' : 'rgba(170,220,255,';
    const grad = ctx.createRadialGradient(cam.x, cam.y, 6, cam.x, cam.y, range);
    grad.addColorStop(0, coneColor + (alarming ? '0.4)' : '0.26)'));
    grad.addColorStop(1, coneColor + '0.04)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, range, cam.angle - half, cam.angle + half);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = coneColor + '0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, range, cam.angle - half, cam.angle + half);
    ctx.closePath();
    ctx.stroke();
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

export function drawPlayer(ctx, player, time) {
  // Noise ring while walking loud.
  if (player.moving && !player.sneaking) {
    const phase = (time * 2.4) % 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * (1 - phase)) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14 + phase * 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  const hidden = player.hiddenInBush;
  ctx.save();
  ctx.globalAlpha = hidden ? 0.45 : 1;
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  // Hooded cloak: dark teal body, gold trim, face shadow.
  ctx.fillStyle = '#0f3d33';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 13, -1.1, 1.1);
  ctx.stroke();
  ctx.fillStyle = '#123b32';
  ctx.fillRect(7, -6, 8, 12);
  ctx.fillStyle = '#e8eefb';
  ctx.beginPath();
  ctx.arc(4, -3.5, 1.8, 0, Math.PI * 2);
  ctx.arc(4, 3.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(223,230,242,0.8)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 22);
  }
  if (hidden) {
    ctx.fillStyle = '#7be495';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hidden', player.x, player.y - 22);
  }
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
