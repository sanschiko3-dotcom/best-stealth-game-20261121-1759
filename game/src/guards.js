// Guard patrols, vision cones and the detection model.
// A guard patrols waypoints, watches a cone, and builds suspicion when the player
// is inside the cone with a clear line of sight. Suspicion decays out of sight,
// so a near miss can be recovered from; full suspicion means a chase, and a
// touch while chasing means caught.
import { TILE, hasLineOfSight, tileKindAtPx } from './level.js';
import { clamp, distance, angleDifference } from './rng.js';

export const VISION_RANGE = 185;
export const VISION_HALF_ANGLE = Math.PI / 5.2; // ~35 degrees each side
export const CHASE_SPEED = 118;
export const SUSPICION_MAX = 100;
export const ALERT_AT = 100;
export const WARY_AT = 50;

const PATROL_PAUSE = 0.7; // seconds spent looking around at each waypoint

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints.map(([col, row]) => ({
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
    }));
    this.speed = def.speed;
    this.color = def.color;
    this.x = this.waypoints[def.startIndex ?? 0].x;
    this.y = this.waypoints[def.startIndex ?? 0].y;
    this.targetIndex = (def.startIndex ?? 0) + 1;
    if (this.targetIndex >= this.waypoints.length) this.targetIndex = 0;
    this.angle = def.startAngle ?? 0;
    this.suspicion = 0;
    this.state = 'patrol'; // patrol | wary (investigate) | chase
    this.pauseTimer = 0;
    this.investigateX = 0;
    this.investigateY = 0;
    this.lastSeenX = 0;
    this.lastSeenY = 0;
    this.loseTimer = 0; // seconds since the player was last seen while chasing
    this.stepTimer = 0; // footstep pacing
    this.moving = false;
  }

  // Can this guard see the player right now? Cones, range, walls and hiding all count.
  canSee(player) {
    const d = distance(this.x, this.y, player.x, player.y);
    if (d > VISION_RANGE) return { seen: false, rate: 0 };
    const toPlayer = Math.atan2(player.y - this.y, player.x - this.x);
    if (Math.abs(angleDifference(this.angle, toPlayer)) > VISION_HALF_ANGLE) {
      return { seen: false, rate: 0 };
    }
    if (!hasLineOfSight(this.x, this.y, player.x, player.y)) return { seen: false, rate: 0 };
    if (player.hiddenInBush && d > 46) return { seen: false, rate: 0 };
    // Closer and standing still in the open is spotted fastest; sneaking, crouching
    // in shadow and distance all slow it down.
    let rate = 62 * (1 - (d / VISION_RANGE) * 0.55);
    if (player.sneaking) rate *= 0.45;
    if (tileKindAtPx(player.x, player.y) === 'D') rate *= 0.5;
    if (player.hiddenInBush) rate *= 0.4;
    return { seen: true, rate };
  }

  update(dt, player, onFootstep) {
    const seen = this.canSee(player);
    if (seen.seen) {
      this.suspicion = clamp(this.suspicion + seen.rate * dt, 0, SUSPICION_MAX);
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
      this.loseTimer = 0;
      if (this.suspicion >= ALERT_AT) this.state = 'chase';
      else if (this.suspicion >= WARY_AT && this.state === 'patrol') {
        this.state = 'wary';
        this.investigateX = player.x;
        this.investigateY = player.y;
      }
    } else {
      this.loseTimer += dt;
      if (this.state === 'chase') {
        // Give the player a real chance to break away: suspicion drains while unseen.
        this.suspicion = clamp(this.suspicion - 16 * dt, 0, SUSPICION_MAX);
        if (this.suspicion < WARY_AT) {
          this.state = 'wary';
          this.investigateX = this.lastSeenX;
          this.investigateY = this.lastSeenY;
        }
      } else {
        this.suspicion = clamp(this.suspicion - 22 * dt, 0, SUSPICION_MAX);
        if (this.state === 'wary' && this.suspicion <= 0) this.state = 'patrol';
      }
    }

    this.moving = false;
    if (this.state === 'chase') {
      this.moveToward(player.x, player.y, CHASE_SPEED, dt, onFootstep);
      this.facePoint(player.x, player.y, dt, 10);
    } else if (this.state === 'wary') {
      const arrived = this.moveToward(this.investigateX, this.investigateY, this.speed * 1.35, dt, onFootstep);
      this.facePoint(this.investigateX, this.investigateY, dt, 8);
      if (arrived) {
        // Look around the spot, then give up and go back to patrol.
        this.pauseTimer += dt;
        this.angle += dt * 1.6;
        if (this.pauseTimer > 2.2) {
          this.pauseTimer = 0;
          this.state = 'patrol';
        }
      }
    } else {
      this.patrol(dt, onFootstep);
    }
  }

  patrol(dt, onFootstep) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      this.angle += dt * 0.9; // glance around while waiting
      return;
    }
    const target = this.waypoints[this.targetIndex];
    const arrived = this.moveToward(target.x, target.y, this.speed, dt, onFootstep);
    this.facePoint(target.x, target.y, dt, 6);
    if (arrived) {
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      this.pauseTimer = PATROL_PAUSE;
    }
  }

  // Walk toward a point; returns true when close enough to count as arrived.
  moveToward(tx, ty, speed, dt, onFootstep) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.moving = true;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = 0.42;
      if (onFootstep) onFootstep(this.x, this.y);
    }
    return d - step < 6;
  }

  facePoint(tx, ty, dt, turnRate) {
    const wanted = Math.atan2(ty - this.y, tx - this.x);
    this.angle += clamp(angleDifference(this.angle, wanted), -turnRate * dt, turnRate * dt);
  }

  // Caught when a chasing guard gets within touching distance.
  touches(player) {
    return this.state === 'chase' && distance(this.x, this.y, player.x, player.y) < 26;
  }
}

export const GUARD_DEFS = [
  { name: 'Rook', color: '#e05a4e', speed: 62, startIndex: 1, waypoints: [[2, 1], [29, 1]] },
  { name: 'Bishop', color: '#e0a44e', speed: 56, startIndex: 0, waypoints: [[12, 7], [12, 11], [18, 11], [18, 7]] },
  { name: 'Knight', color: '#e05a9e', speed: 66, startIndex: 1, waypoints: [[2, 17], [29, 17]] },
  { name: 'Queen', color: '#7a5ae0', speed: 56, startIndex: 0, waypoints: [[24, 7], [24, 11], [29, 11], [29, 7]] },
  { name: 'Pawn', color: '#4ea8e0', speed: 50, startIndex: 0, waypoints: [[2, 6], [29, 6]] },
];
