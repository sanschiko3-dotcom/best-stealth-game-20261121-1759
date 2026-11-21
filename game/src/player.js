// The thief: keyboard movement, hold-Shift sneak, click-to-walk, hiding in bushes.
import { resolveCircleCollision, tileKindAtPx } from './level.js';
import { clamp } from './rng.js';

export const PLAYER_RADIUS = 13;
const WALK_SPEED = 165;
const SNEAK_SPEED = 88;

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.angle = 0; // facing, radians
    this.sneaking = false;
    this.moving = false;
    this.hiddenInBush = false;
    this.walkTarget = null; // {x, y} set by a mouse click, cleared by keys
    this.stepTimer = 0;
    this.noiseRadius = 0; // how far footsteps carry this frame
  }

  update(dt, keys, onFootstep) {
    let dx = 0;
    let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    const keyboardMoving = dx !== 0 || dy !== 0;
    if (keyboardMoving) this.walkTarget = null;

    if (!keyboardMoving && this.walkTarget) {
      const tx = this.walkTarget.x - this.x;
      const ty = this.walkTarget.y - this.y;
      const d = Math.hypot(tx, ty);
      if (d < 8) this.walkTarget = null;
      else { dx = tx / d; dy = ty / d; }
    }

    this.sneaking = !!keys.sneak;
    const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    if (this.moving) {
      const nx = this.x + (dx / len) * speed * dt;
      const ny = this.y + (dy / len) * speed * dt;
      const fixed = resolveCircleCollision(nx, ny, PLAYER_RADIUS);
      this.x = clamp(fixed.x, PLAYER_RADIUS, 1280 - PLAYER_RADIUS);
      this.y = clamp(fixed.y, PLAYER_RADIUS, 800 - PLAYER_RADIUS);
      this.angle = Math.atan2(dy, dx);
      this.noiseRadius = this.sneaking ? 26 : 95;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.52 : 0.34;
        if (onFootstep) onFootstep(this.x, this.y, this.sneaking);
      }
    } else {
      this.noiseRadius = 0;
    }
    this.hiddenInBush = tileKindAtPx(this.x, this.y) === 'B';
  }
}
