// The coin-toss gadget: throw a coin to distract a guard.
// The coin flies to its target, lands with a ring and a clink, and the nearest
// patrolling guard within earshot walks over to investigate the landing spot.
// One coin can be in the air at a time; each heist starts with 5 coins.
import { distance } from './rng.js';

export const COINS_PER_LEVEL = 5;
export const COIN_HEARING_RANGE = 260;

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
