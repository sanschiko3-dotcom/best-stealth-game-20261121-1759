// The coin-toss gadget: throw a coin to distract a guard.
// The coin flies to its target, lands with a ring and a clink, and the nearest
// patrolling guard within earshot walks over to investigate the landing spot.
// One coin can be in the air at a time; each heist starts with 5 coins.
import { distance } from './rng.js';

export const COINS_PER_LEVEL = 5;
export const COIN_HEARING_RANGE = 260;
export const SMOKE_PER_LEVEL = 2;
export const SMOKE_RADIUS = 70;
export const SMOKE_DURATION = 4;

const FLIGHT_TIME = 0.45;
const RING_TIME = 2.2;

export class CoinToss {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.flight = 0;
    this.landed = false;
    this.ringTimer = 0;
    this.distracted = false; // a guard has already been sent to this coin
  }

  throwCoin(fromX, fromY, toX, toY) {
    this.active = true;
    this.startX = fromX;
    this.startY = fromY;
    this.x = fromX;
    this.y = fromY;
    this.targetX = toX;
    this.targetY = toY;
    this.flight = 0;
    this.landed = false;
    this.ringTimer = 0;
    this.distracted = false;
  }

  // Advance the flight; returns 'landed' on the frame it touches down.
  update(dt) {
    if (!this.active) return null;
    if (!this.landed) {
      this.flight += dt / FLIGHT_TIME;
      if (this.flight >= 1) {
        this.flight = 1;
        this.landed = true;
        this.ringTimer = RING_TIME;
        this.x = this.targetX;
        this.y = this.targetY;
        return 'landed';
      }
      const t = this.flight;
      this.x = this.startX + (this.targetX - this.startX) * t;
      this.y = this.startY + (this.targetY - this.startY) * t - Math.sin(t * Math.PI) * 26;
      return null;
    }
    this.ringTimer -= dt;
    if (this.ringTimer <= 0) this.active = false;
    return null;
  }

  // The nearest patrolling guard in earshot, or null.
  nearestPatrollingGuard(guards) {
    let best = null;
    let bestDist = COIN_HEARING_RANGE;
    for (const g of guards) {
      if (g.state !== 'patrol') continue;
      const d = distance(g.x, g.y, this.targetX, this.targetY);
      if (d < bestDist) { best = g; bestDist = d; }
    }
    return best;
  }
}

// The smoke pellet: throw it and it blooms into a cloud no vision cone can
// see through. One pellet flies at a time; each heist starts with 2.
// A thrown coin pulls a guard over; smoke does the opposite — it hides you
// where you stand, so you can slip past a cone or break a chase.
const SMOKE_FLIGHT_TIME = 0.4;

export class SmokePellet {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.flight = 0;
    this.landed = false;
    this.timer = 0; // seconds of cloud left once it blooms
  }

  throwSmoke(fromX, fromY, toX, toY) {
    this.active = true;
    this.startX = fromX;
    this.startY = fromY;
    this.x = fromX;
    this.y = fromY;
    this.targetX = toX;
    this.targetY = toY;
    this.flight = 0;
    this.landed = false;
    this.timer = 0;
  }

  // Advance the flight; returns 'bloomed' on the frame the cloud opens.
  update(dt) {
    if (!this.active) return null;
    if (!this.landed) {
      this.flight += dt / SMOKE_FLIGHT_TIME;
      if (this.flight >= 1) {
        this.flight = 1;
        this.landed = true;
        this.timer = SMOKE_DURATION;
        this.x = this.targetX;
        this.y = this.targetY;
        return 'bloomed';
      }
      const t = this.flight;
      this.x = this.startX + (this.targetX - this.startX) * t;
      this.y = this.startY + (this.targetY - this.startY) * t - Math.sin(t * Math.PI) * 18;
      return null;
    }
    this.timer -= dt;
    if (this.timer <= 0) this.active = false;
    return null;
  }
}

// True when the sight line from (x1, y1) to (x2, y2) passes through a smoke
// cloud: the cloud's centre comes within its radius of the segment.
export function smokeBlocksSight(x1, y1, x2, y2, cloud) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((cloud.x - x1) * dx + (cloud.y - y1) * dy) / len2));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return distance(px, py, cloud.x, cloud.y) < cloud.r;
}
