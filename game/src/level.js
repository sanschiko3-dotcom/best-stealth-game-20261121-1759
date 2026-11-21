// Level layouts for Shadow Ledger: three hand-built heists.
// Legend: # wall, . floor, B bush (hides you), C crate (blocks sight + movement),
// D shadow floor (you are spotted half as fast), L ledger page, g gold coin (+$25),
// P player start, E exit. Each level also carries its guard patrols, security
// cameras, lamp positions and floor palette.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;

export const LEVELS = [
  {
    name: 'THE ARCHIVE',
    subtitle: 'Heist 1 of 3 — the Meridian Archive',
    palette: { floorA: '#141a29', floorB: '#151c2c', wall: '#232c40', wallTop: '#2f3c58', wallBottom: '#1a2233', shadow: '#0d1322' },
    lamps: [[4, 1], [27, 6], [10, 12], [24, 16]],
    guards: [
      { name: 'Rook', color: '#e05a4e', speed: 62, startIndex: 1, waypoints: [[2, 1], [29, 1]] },
      { name: 'Bishop', color: '#e0a44e', speed: 56, startIndex: 0, waypoints: [[12, 7], [12, 11], [18, 11], [18, 7]] },
      { name: 'Knight', color: '#e05a9e', speed: 66, startIndex: 1, waypoints: [[2, 17], [29, 17]] },
      { name: 'Queen', color: '#7a5ae0', speed: 56, startIndex: 0, waypoints: [[24, 7], [24, 11], [29, 11], [29, 7]] },
      { name: 'Pawn', color: '#4ea8e0', speed: 50, startIndex: 0, waypoints: [[2, 6], [29, 6]] },
    ],
    cameras: [],
    map: [
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
    ],
  },
  {
    name: 'THE GALLERY',
    subtitle: 'Heist 2 of 3 — the Hall of Portraits',
    palette: { floorA: '#1a1429', floorB: '#1c162e', wall: '#2c2340', wallTop: '#3a2f58', wallBottom: '#1d1730', shadow: '#120d22' },
    lamps: [[5, 2], [25, 6], [10, 12], [22, 16]],
    guards: [
      { name: 'Rook', color: '#e05a4e', speed: 64, startIndex: 1, waypoints: [[2, 1], [29, 1]] },
      { name: 'Bishop', color: '#e0a44e', speed: 58, startIndex: 0, waypoints: [[2, 10], [29, 10]] },
      { name: 'Knight', color: '#e05a9e', speed: 68, startIndex: 1, waypoints: [[7, 18], [24, 18]] },
      { name: 'Queen', color: '#7a5ae0', speed: 58, startIndex: 0, waypoints: [[18, 2], [18, 17]] },
      { name: 'Pawn', color: '#4ea8e0', speed: 52, startIndex: 0, waypoints: [[29, 2], [29, 17]] },
      { name: 'Sage', color: '#4ee0c8', speed: 60, startIndex: 0, waypoints: [[16, 12], [24, 12]] },
    ],
    cameras: [
      { col: 8, row: 2, baseAngle: 0, sweep: 0.6, speed: 0.7 },
    ],
    map: [
      '################################',
      '#P.............................#',
      '#.......#....B.....#....g......#',
      '#.###...#..........#...........#',
      '#.#.....#....####..#...#####...#',
      '#.#..C.......#..#......#...#...#',
      '#.#..........#..#..L...#...#...#',
      '#.#####......#..#......#...#...#',
      '#.....#......####..C...#...#...#',
      '#.B...#...........D........#...#',
      '#..............................#',
      '#..g..#....#..#....B......#....#',
      '#.....#....#..#...........#..L.#',
      '#.#####....#..#....####...#....#',
      '#.....D....#..#....#......#....#',
      '#.C........#..#..C.#..g...#....#',
      '#....###...#..#....#.......#...#',
      '#....#.....#..#....#....#####..#',
      '#....#..L.......g........#...E.#',
      '################################',
    ],
  },
  {
    name: 'THE VAULT',
    subtitle: 'Heist 3 of 3 — the Star Sapphire vault',
    palette: { floorA: '#171a2e', floorB: '#191d33', wall: '#2a3350', wallTop: '#3d4a70', wallBottom: '#1c2340', shadow: '#10142a' },
    lamps: [[5, 2], [25, 6], [10, 12], [22, 16], [14, 10]],
    guards: [
      { name: 'Rook', color: '#e05a4e', speed: 66, startIndex: 1, waypoints: [[2, 1], [29, 1]] },
      { name: 'Bishop', color: '#e0a44e', speed: 60, startIndex: 0, waypoints: [[2, 10], [29, 10]] },
      { name: 'Knight', color: '#e05a9e', speed: 70, startIndex: 1, waypoints: [[7, 18], [24, 18]] },
      { name: 'Queen', color: '#7a5ae0', speed: 60, startIndex: 0, waypoints: [[18, 2], [18, 17]] },
      { name: 'Pawn', color: '#4ea8e0', speed: 54, startIndex: 0, waypoints: [[29, 2], [29, 17]] },
      { name: 'Sage', color: '#4ee0c8', speed: 62, startIndex: 0, waypoints: [[16, 12], [24, 12]] },
      { name: 'Warden', color: '#e0e04e', speed: 58, startIndex: 0, waypoints: [[17, 6], [22, 6]] },
    ],
    cameras: [
      { col: 8, row: 2, baseAngle: 0, sweep: 0.6, speed: 0.7 },
      { col: 26, row: 11, baseAngle: Math.PI, sweep: 0.5, speed: 0.9 },
    ],
    map: [
      '################################',
      '#P.............................#',
      '#.......#.....g......#....B....#',
      '#.###...#..........#....#####..#',
      '#.#.....#....####..#....#..#...#',
      '#.#..C.......#..#..g...#...#...#',
      '#.#..........#..#......#...#...#',
      '#.#####......#..#..L...#...#...#',
      '#.....#......####..C...#...#...#',
      '#.B...#...........D........#...#',
      '#..............................#',
      '#..g..#....#..#....B......#..L.#',
      '#.....#....#..#...........#....#',
      '#.#####....#..#....####...#..D.#',
      '#.....D....#..#....#......#....#',
      '#.C........#..#..C.#..g...#....#',
      '#....###...#..#....#...g...#...#',
      '#....#.....#..#....#....#####..#',
      '#....#..L.......g........#...E.#',
      '################################',
    ],
  },
];

export const MAP = LEVELS[0].map;

// The map the collision / sight helpers read; parseLevel switches it.
let currentMap = LEVELS[0].map;

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return currentMap[row][col];
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

// Parse one heist map into the lists the game uses. Throws on a malformed map.
export function parseLevel(index = 0) {
  const def = LEVELS[index];
  if (!def) throw new Error('no level ' + index);
  currentMap = def.map;
  const map = def.map;
  if (map.length !== ROWS) throw new Error('map row count is ' + map.length);
  const bushes = [];
  const crates = [];
  const shadows = [];
  const ledgers = [];
  const gold = [];
  let spawn = null;
  let exit = null;
  for (let row = 0; row < ROWS; row++) {
    if (map[row].length !== COLS) throw new Error('map row ' + row + ' is ' + map[row].length + ' wide');
    for (let col = 0; col < COLS; col++) {
      const t = map[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (t === 'B') bushes.push({ x: cx, y: cy, col, row });
      else if (t === 'C') crates.push({ x: cx, y: cy, col, row });
      else if (t === 'D') shadows.push({ x: cx, y: cy, col, row });
      else if (t === 'L') ledgers.push({ x: cx, y: cy, col, row, taken: false });
      else if (t === 'g') gold.push({ x: cx, y: cy, col, row, taken: false });
      else if (t === 'P') spawn = { x: cx, y: cy };
      else if (t === 'E') exit = { x: cx, y: cy, col, row };
    }
  }
  if (!spawn) throw new Error('map has no player spawn');
  if (!exit) throw new Error('map has no exit');
  if (ledgers.length !== 3) throw new Error('map needs 3 ledgers, has ' + ledgers.length);
  return {
    index, name: def.name, subtitle: def.subtitle, palette: def.palette,
    lamps: def.lamps.map(([col, row]) => ({ x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 })),
    guardDefs: def.guards, cameraDefs: def.cameras,
    bushes, crates, shadows, ledgers, gold, spawn, exit,
  };
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
