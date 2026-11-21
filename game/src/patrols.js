// Patrol routes, drawn faint so a patient thief can learn them: one dotted
// path per guard through its waypoints, in that guard's colour. Shown only
// with the field notes on, so live play stays clean.
export function drawPatrolPaths(ctx, guards) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.setLineDash([2, 9]);
  ctx.lineWidth = 2;
  for (const g of guards) {
    if (g.waypoints.length < 2) continue;
    ctx.strokeStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(g.waypoints[0].x, g.waypoints[0].y);
    for (let i = 1; i < g.waypoints.length; i++) {
      ctx.lineTo(g.waypoints[i].x, g.waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = g.color;
    for (const w of g.waypoints) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
