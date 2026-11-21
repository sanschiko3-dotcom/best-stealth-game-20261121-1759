// Lamp pools and the light/dark reading of a position: lamps mark where the
// thief is easy to see, shadow floor where they are hard to spot. The HUD's
// visibility word and the ring under the player both read this.
import { tileKindAtPx } from './level.js';

const LAMP_GLOW_RADIUS = 120;
const LIT_RADIUS = 95;

// Warm lamp pools: light that marks where you are easy to see.
export function drawLamps(ctx, level, time) {
  for (const lamp of level.lamps) {
    const flicker = 0.85 + Math.sin(time * 2.1 + lamp.x * 0.05) * 0.06;
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, LAMP_GLOW_RADIUS);
    glow.addColorStop(0, 'rgba(255,196,110,' + (0.3 * flicker) + ')');
    glow.addColorStop(0.45, 'rgba(255,196,110,' + (0.12 * flicker) + ')');
    glow.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lamp.x - LAMP_GLOW_RADIUS, lamp.y - LAMP_GLOW_RADIUS, LAMP_GLOW_RADIUS * 2, LAMP_GLOW_RADIUS * 2);
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,160,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// How lit a position is: 'lit' near a lamp, 'shadow' on dark floor, 'dim'
// everywhere else. Shadow floor halves how fast a guard spots you.
export function visibilityAt(level, x, y) {
  if (tileKindAtPx(x, y) === 'D') return 'shadow';
  for (const lamp of level.lamps) {
    if (Math.hypot(x - lamp.x, y - lamp.y) < LIT_RADIUS) return 'lit';
  }
  return 'dim';
}
