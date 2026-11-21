// Deterministic staged scenes for screenshots (?shot=overview|cone|hide|exit).
// Each scene sets the live game state to a fixed, readable moment and freezes
// the simulation, so the screenshot is a real render of the game's own code.
import { TILE } from './level.js';

function placeAt(entity, col, row) {
  entity.x = col * TILE + TILE / 2;
  entity.y = row * TILE + TILE / 2;
}

function guardByName(game, name) {
  return game.guards.find((g) => g.name === name);
}

export function stageShot(game, name) {
  const level = game.level;
  // Reset to a clean mid-game state first.
  level.ledgers.forEach((l) => { l.taken = false; });
  game.guards.forEach((g) => { g.suspicion = 0; g.state = 'patrol'; });
  game.particles.length = 0;
  game.alerts = 0;
  game.state = 'playing';
  game.frozen = true;
  game.time = 42.5; // fixed clock so every render of a scene matches

  if (name === 'overview') {
    // Cover: the whole archive at a glance — player mid-level, two pages in hand,
    // cones sweeping, exit still locked.
    placeAt(game.player, 8, 10);
    game.player.angle = -Math.PI / 2;
    level.ledgers[0].taken = true;
    level.ledgers[1].taken = true;
    game.pagesFound = 2;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 20, 1); rook.angle = Math.PI;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 12, 9); bishop.angle = Math.PI / 2;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 14, 17); knight.angle = 0;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 26, 9); queen.angle = Math.PI;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 15, 6); pawn.angle = 0;
  } else if (name === 'cone') {
    // A guard's cone has caught the thief: suspicion climbing, "?" overhead.
    placeAt(game.player, 14, 6);
    game.player.angle = Math.PI;
    game.player.sneaking = true;
    level.ledgers[0].taken = true;
    game.pagesFound = 1;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 10, 6);
    pawn.angle = 0;
    pawn.suspicion = 62;
    pawn.state = 'wary';
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 22, 1); rook.angle = Math.PI;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 15, 10); bishop.angle = -Math.PI / 2;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 8, 17); knight.angle = 0;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 27, 10); queen.angle = Math.PI / 2;
  } else if (name === 'hide') {
    // Hidden in a bush while a guard walks past, almost unnoticed.
    placeAt(game.player, 4, 9);
    game.player.angle = 0;
    game.player.hiddenInBush = true;
    level.ledgers[0].taken = true;
    game.pagesFound = 1;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 7, 9);
    bishop.angle = Math.PI;
    bishop.suspicion = 18;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 6, 1); rook.angle = 0;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 20, 17); knight.angle = Math.PI;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 26, 7); queen.angle = Math.PI / 2;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 20, 6); pawn.angle = Math.PI;
  } else if (name === 'exit') {
    // All three pages stolen, exit open, one last guard between the thief and freedom.
    placeAt(game.player, 27, 18);
    game.player.angle = 0;
    level.ledgers.forEach((l) => { l.taken = true; });
    game.pagesFound = 3;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 20, 17);
    knight.angle = Math.PI;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 12, 1); rook.angle = 0;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 15, 8); bishop.angle = Math.PI / 2;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 24, 11); queen.angle = -Math.PI / 2;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 8, 6); pawn.angle = 0;
  } else {
    return false;
  }
  game.player.hiddenInBush = game.player.hiddenInBush && true;
  game.player.walkTarget = null;
  return true;
}
