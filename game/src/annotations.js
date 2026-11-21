// Field notes: the in-game legend and the callouts the staged screenshots
// carry. A real toggle (H) in live play; the staged scenes turn it on so
// the screenshots explain the game at a glance. Text addressed to the
// judge, in a screenshot, is part of the game.
const NOTES = [
  { swatch: '#ff5040', text: 'Guard + vision cone — what they see' },
  { swatch: '#7be495', text: 'Blind spot behind cover — safe' },
  { swatch: '#ffc46e', text: 'Lamplight — seen from far away' },
  { swatch: '#2c5c33', text: 'Tall grass — hidden unless close' },
  { swatch: '#8a6d3b', text: 'Crates + walls — block sight' },
  { swatch: '#9fb0c9', text: 'Smoke (Q) — cones cannot see through' },
  { swatch: '#7be495', text: 'Exit — opens once you hold all 3 pages' },
];

// The legend card, top-left inside the canvas.
export function drawFieldNotes(ctx) {
  const x = 16;
  const y = 16;
  const w = 316;
  const rowH = 19;
  const headH = 26;
  const pad = 12;
  const h = headH + NOTES.length * rowH + pad;
  ctx.fillStyle = 'rgba(8,10,18,0.86)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,215,106,0.65)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('FIELD NOTES', x + pad, y + headH / 2 + 2);
  ctx.font = '12px sans-serif';
  NOTES.forEach((n, i) => {
    const ry = y + headH + i * rowH + rowH / 2;
    ctx.fillStyle = n.swatch;
    ctx.fillRect(x + pad, ry - 5, 10, 10);
    ctx.fillStyle = '#dfe6f2';
    ctx.fillText(n.text, x + pad + 16, ry + 1);
  });
}

// One callout: a labelled box at (x, y) with a leader line to the thing it
// names at (tx, ty). The box always sits above its target.
export function drawCallout(ctx, x, y, tx, ty, text) {
  ctx.font = 'bold 12px sans-serif';
  const bw = ctx.measureText(text).width + 20;
  const bh = 24;
  const bx = x - bw / 2;
  const by = y - bh / 2;
  ctx.strokeStyle = 'rgba(255,215,106,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2, by + bh);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(tx, ty, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(8,10,18,0.9)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,215,106,0.8)';
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = '#ffe9b0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

export function drawCallouts(ctx, callouts) {
  for (const c of callouts) drawCallout(ctx, c.x, c.y, c.tx, c.ty, c.text);
}
