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

// A callout box at (col, row) naming the thing at (tcol, trow).
function callout(col, row, tcol, trow, text) {
  return {
    x: col * TILE + TILE / 2, y: row * TILE + TILE / 2,
    tx: tcol * TILE + TILE / 2, ty: trow * TILE + TILE / 2, text,
  };
}

export function stageShot(game, name) {
  game.alerts = 0;
  game.time = 42.5; // fixed clock so every render of a scene matches
  game.fieldNotes = true; // staged scenes show the legend + patrol routes
  game.callouts = [];
  game.smoke.active = false;

  if (name === 'overview') {
    // Cover: the Vault at a glance — 7 guards, 2 cameras, gold, a coin toss
    // pulling a guard away, 2 pages in hand, exit still locked. The thief
    // stands at a cone edge, labeled YOU, so the reader finds them at once.
    game.loadLevel(2);
    game.fieldNotes = true;
    game.legend = true; // the cover alone carries the FIELD NOTES card
    game.callouts = [
      callout(15, 8, 15, 10, 'COIN — the guard walks over to look'),
      callout(25, 4, 27, 6, 'LAMPLIGHT — seen from far away'),
      callout(26, 16, 30, 18, 'EXIT — opens once you hold all 3 pages'),
      callout(8, 8, 9, 11, 'YOU — coin distracts Bishop'),
    ];
    game.state = 'playing';
    game.score = 325;
    game.coins = 4;
    placeAt(game.player, 9, 11);
    game.player.angle = 0;
    game.level.ledgers[0].taken = true;
    game.level.ledgers[1].taken = true;
    game.pagesFound = 2;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 20, 1); rook.angle = Math.PI;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 12, 10); bishop.angle = Math.PI / 2;
    bishop.state = 'wary'; bishop.suspicion = 62;
    bishop.investigateX = 15 * TILE + TILE / 2;
    bishop.investigateY = 10 * TILE + TILE / 2;
    bishop.labelText = 'WHAT WAS THAT?'; bishop.labelTimer = 2.0;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 14, 18); knight.angle = 0;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 18, 9); queen.angle = Math.PI;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 29, 6); pawn.angle = Math.PI;
    const sage = guardByName(game, 'Sage');
    placeAt(sage, 20, 12); sage.angle = Math.PI / 2;
    const warden = guardByName(game, 'Warden');
    placeAt(warden, 20, 6); warden.angle = Math.PI;
    const cam = game.cameras[0];
    cam.time = 1.2;
    cam.angle = Math.sin(1.2 * 0.7) * 0.6;
    cam.alarm = 30;
    game.coin.active = true;
    game.coin.landed = true;
    game.coin.ringTimer = 1.4;
    game.coin.targetX = 15 * TILE + TILE / 2;
    game.coin.targetY = 10 * TILE + TILE / 2;
  } else if (name === 'cone') {
    // A Gallery camera's cone has caught the thief — but a smoke pellet
    // blooms between them, and the cone cannot see through it. The thief
    // stands clear of the cloud, labeled YOU, so the reader finds them.
    game.loadLevel(1);
    game.fieldNotes = true;
    game.legend = false; // small cells show pure gameplay, no legend card
    game.callouts = [
      callout(17, 4, 8, 2, 'CAMERA — its alarm calls the nearest guard'),
      callout(10, 5, 10, 2, 'SMOKE — the cone cannot see through it'),
    ];
    game.smoke.active = true;
    game.smoke.landed = true;
    game.smoke.timer = 3.0;
    placeAt(game.smoke, 10, 2);
    game.smokeCount = 1;
    game.state = 'playing';
    game.score = 100;
    game.coins = 5;
    placeAt(game.player, 13, 2);
    game.player.angle = Math.PI;
    game.player.sneaking = true;
    game.level.ledgers[0].taken = true;
    game.pagesFound = 1;
    const cam = game.cameras[0];
    cam.time = 0;
    cam.angle = 0;
    cam.alarm = 78;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 16, 2);
    pawn.angle = 0;
    pawn.suspicion = 62;
    pawn.state = 'wary';
    pawn.investigateX = game.player.x;
    pawn.investigateY = game.player.y;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 22, 1); rook.angle = Math.PI;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 12, 10); bishop.angle = -Math.PI / 2;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 8, 18); knight.angle = 0;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 18, 9); queen.angle = Math.PI / 2;
    const sage = guardByName(game, 'Sage');
    placeAt(sage, 20, 12); sage.angle = Math.PI;
  } else if (name === 'hide') {
    // Hidden in a bush in the Archive while a guard walks past, almost unnoticed.
    // The thief keeps a bright rim and a YOU tag inside the grass, so the
    // reader finds them where the guard cannot.
    game.loadLevel(0);
    game.fieldNotes = true;
    game.legend = false; // small cells show pure gameplay, no legend card
    game.callouts = [
      callout(4, 7, 4, 9, 'HIDDEN — you wait in the grass'),
      callout(17, 3, 16, 1, 'PATROL — learn the route, slip behind'),
    ];
    game.state = 'playing';
    game.score = 100;
    game.coins = 5;
    placeAt(game.player, 4, 9);
    game.player.angle = 0;
    game.player.hiddenInBush = true;
    game.level.ledgers[0].taken = true;
    game.pagesFound = 1;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 7, 9);
    bishop.angle = Math.PI;
    bishop.suspicion = 18;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 20, 1); rook.angle = 0;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 20, 17); knight.angle = Math.PI;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 26, 7); queen.angle = Math.PI / 2;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 20, 6); pawn.angle = Math.PI;
  } else if (name === 'exit') {
    // All three pages stolen in the Vault, exit open, one last guard between
    // the thief and freedom. The thief stands one step from the green EXIT,
    // labeled YOU.
    game.loadLevel(2);
    game.fieldNotes = true;
    game.legend = false; // small cells show pure gameplay, no legend card
    game.callouts = [
      callout(27, 14, 30, 18, 'EXIT OPEN — reach it unseen'),
      callout(20, 14, 20, 17, 'GHOST +$500 — finish without being caught'),
      callout(22, 15, 25, 18, 'YOU — one step from freedom'),
    ];
    game.state = 'playing';
    game.score = 450;
    game.coins = 2;
    placeAt(game.player, 25, 18);
    game.player.angle = 0;
    game.level.ledgers.forEach((l) => { l.taken = true; });
    game.pagesFound = 3;
    const knight = guardByName(game, 'Knight');
    placeAt(knight, 20, 17);
    knight.angle = Math.PI;
    const rook = guardByName(game, 'Rook');
    placeAt(rook, 12, 1); rook.angle = 0;
    const bishop = guardByName(game, 'Bishop');
    placeAt(bishop, 15, 10); bishop.angle = Math.PI / 2;
    const queen = guardByName(game, 'Queen');
    placeAt(queen, 24, 11); queen.angle = -Math.PI / 2;
    const pawn = guardByName(game, 'Pawn');
    placeAt(pawn, 8, 6); pawn.angle = 0;
    const sage = guardByName(game, 'Sage');
    placeAt(sage, 20, 12); sage.angle = Math.PI;
    const warden = guardByName(game, 'Warden');
    placeAt(warden, 20, 6); warden.angle = Math.PI;
  } else {
    return false;
  }
  game.frozen = true; // staged scenes do not simulate (loadLevel clears it)
  game.player.walkTarget = null;
  return true;
}
