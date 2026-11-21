// Security cameras: wall-mounted, sweeping vision cones.
// A camera builds alarm while the player stands in its cone with a clear line
// of sight. At full alarm it calls the nearest guard to investigate the
// player's position, then the alarm drops back halfway.
import { TILE, hasLineOfSight } from './level.js';
import { clamp, distance, angleDifference } from './rng.js';

export const CAMERA_RANGE = 210;
export const CAMERA_HALF_ANGLE = Math.PI / 6.5; // ~28 degrees each side
export const CAMERA_ALARM_MAX = 100;

export class SecurityCamera {
  constructor(def) {
    this.x = def.col * TILE + TILE / 2;
    this.y = def.row * TILE + TILE / 2;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.angle = def.baseAngle;
    this.alarm = 0;
    this.time = 0;
    this.flash = 0; // seconds left of the red "spotted" flash after tripping
  }

  // Can this camera see the player right now? The sight line starts just
  // in front of the wall mount, so the camera's own wall tile never blocks it.
  canSee(player) {
    const ox = this.x + Math.cos(this.angle) * 24;
    const oy = this.y + Math.sin(this.angle) * 24;
    const d = distance(ox, oy, player.x, player.y);
    if (d > CAMERA_RANGE) return { seen: false, rate: 0 };
    const toPlayer = Math.atan2(player.y - oy, player.x - ox);
    if (Math.abs(angleDifference(this.angle, toPlayer)) > CAMERA_HALF_ANGLE) {
      return { seen: false, rate: 0 };
    }
    if (!hasLineOfSight(ox, oy, player.x, player.y)) return { seen: false, rate: 0 };
    if (player.hiddenInBush && d > 46) return { seen: false, rate: 0 };
    let rate = 78 * (1 - (d / CAMERA_RANGE) * 0.4);
    if (player.sneaking) rate *= 0.6;
    return { seen: true, rate };
  }

  // Sweep the cone, build or drain alarm. Returns true the moment it trips.
  update(dt, player) {
    this.time += dt;
    this.angle = this.baseAngle + Math.sin(this.time * this.speed) * this.sweep;
    if (this.flash > 0) this.flash -= dt;
    const seen = this.canSee(player);
    if (seen.seen) {
      this.alarm = clamp(this.alarm + seen.rate * dt, 0, CAMERA_ALARM_MAX);
      if (this.alarm >= CAMERA_ALARM_MAX) {
        this.alarm = 45;
        this.flash = 1.2;
        return true;
      }
    } else {
      this.alarm = clamp(this.alarm - 26 * dt, 0, CAMERA_ALARM_MAX);
    }
    return false;
  }
}
