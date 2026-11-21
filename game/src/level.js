// Level layout for Shadow Ledger: one hand-built archive floor.
// Legend: # wall, . floor, B bush (hides you), C crate (blocks sight + movement),
// D shadow floor (you are spotted half as fast), L ledger page, P player start, E exit.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;

export const MAP = [
  '################################',
  '#P.............................#',
  '#...#####......#####......###..#',
  '#...#..........B.....C....#..L.#',
  '#...#......................#...#',
  '#...#####......#####......###..#',
  '#......D................D......#',
  '#.C.......####.....####....C...#',
  '#.........#..#.....#..#........#',
  '#...B.....#..#..L..#..#....B...#',
  '#.........#..#.....#..#........#',
  '#.........####.....####........#',
  '#......D................D......#',
  '#...#####......#####......###..#',
  '#...#..........B.....C....#....#',
  '#...#......................#...#',
  '#.L.#####......#####......###..#',
  '#..............................#',
  '#.............................E#',
  '################################',
];

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return MAP[row][col];
}

export function isSolidTile(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'C';
}

export function isSolidPx(x, y) {
  return isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE));
}

export function tileKindAtPx(x, y) {
  return tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
}

// Parse the map into lists the game uses. Throws on a malformed map.
export function parseLevel() {
  if (MAP.length !== ROWS) throw new Error('map row count is ' + MAP.length);
  const bushes = [];
  const crates = [];
  const shadows = [];
  const ledgers = [];
  let spawn = null;
  let exit = null;
  for (let row = 0; row < ROWS; row++) {
    if (MAP[row].length !== COLS) throw new Error('map row ' + row + ' is ' + MAP[row].length + ' wide');
    for (let col = 0; col < COLS; col++) {
      const t = MAP[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (t === 'B') bushes.push({ x: cx, y: cy, col, row });
      else if (t === 'C') crates.push({ x: cx, y: cy, col, row });
      else if (t === 'D') shadows.push({ x: cx, y: cy, col, row });
      else if (t === 'L') ledgers.push({ x: cx, y: cy, col, row, taken: false });
      else if (t === 'P') spawn = { x: cx, y: cy };
      else if (t === 'E') exit = { x: cx, y: cy, col, row };
    }
  }
  if (!spawn) throw new Error('map has no player spawn');
  if (!exit) throw new Error('map has no exit');
  if (ledgers.length !== 3) throw new Error('map needs 3 ledgers, has ' + ledgers.length);
  return { bushes, crates, shadows, ledgers, spawn, exit };
}

// True when nothing solid stands between two points (bushes never block sight).
export function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidPx(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Circle-vs-solid-tile collision: slide the circle out of any solid tile it overlaps.
export function resolveCircleCollision(x, y, radius) {
  const minCol = Math.floor((x - radius) / TILE);
  const maxCol = Math.floor((x + radius) / TILE);
  const minRow = Math.floor((y - radius) / TILE);
  const maxRow = Math.floor((y + radius) / TILE);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isSolidTile(col, row)) continue;
      const left = col * TILE;
      const top = row * TILE;
      const nearestX = Math.max(left, Math.min(x, left + TILE));
      const nearestY = Math.max(top, Math.min(y, top + TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      const d2 = dx * dx + dy * dy;
      if (d2 >= radius * radius) continue;
      if (d2 === 0) { y = top - radius; continue; }
      const d = Math.sqrt(d2);
      const push = (radius - d) / d;
      x += dx * push;
      y += dy * push;
    }
  }
  return { x, y };
}
