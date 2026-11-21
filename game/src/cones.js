// Wall-clipped vision cones: a cone is a fan of rays, each ray marching
// until it hits a solid tile, so cones stop at walls and crates instead of
// flooding through them. Guards and cameras share the same shape.
import { isSolidPx } from './level.js';

export const CONE_RAYS = 26;
const STEP_PX = 8;

// The polygon of a cone from (x, y) facing `angle`: the origin, then one
// point per ray, each ray cut short by the first solid pixel it meets.
export function conePolygon(x, y, angle, halfAngle, range, rays = CONE_RAYS) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let r = range;
    for (let d = STEP_PX; d <= range; d += STEP_PX) {
      if (isSolidPx(x + dx * d, y + dy * d)) { r = d; break; }
    }
    points.push({ x: x + dx * r, y: y + dy * r });
  }
  return points;
}

function traceConePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

// Fill + outline a clipped cone. `rgb` is a 'r,g,b' triple; the fill fades
// with distance from the watcher so the far edge stays readable.
export function drawConeShape(ctx, points, rgb, fillAlpha = 0.16) {
  const cx = points[0].x;
  const cy = points[0].y;
  let maxR = 0;
  for (const p of points) maxR = Math.max(maxR, Math.hypot(p.x - cx, p.y - cy));
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(maxR, 1));
  grad.addColorStop(0, 'rgba(' + rgb + ',' + (fillAlpha + 0.18) + ')');
  grad.addColorStop(1, 'rgba(' + rgb + ',0.03)');
  traceConePath(ctx, points);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(' + rgb + ',0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// A cone's colour by the watcher's state: calm is cool slate-blue, wary is
// amber, chase is red — the same code the HUD's alert word uses.
export function coneColorFor(state) {
  if (state === 'chase') return '255,70,50';
  if (state === 'wary') return '255,190,60';
  return '150,180,220';
}
