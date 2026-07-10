export function getSpatialNavScript(direction: string): string {
  return `
(function() {
  try {
    var dir = "${direction}";

    if (!document.getElementById('__gp_focus_style')) {
      var s = document.createElement('style');
      s.id = '__gp_focus_style';
      s.textContent = 'body:not(.has-custom-focus) *:focus{outline:3px solid white!important;box-shadow:0 0 0 6px black,0 0 20px 8px #ff2255!important;transition:box-shadow 0.1s ease-out!important;z-index:2147483647!important}';
      document.head.appendChild(s);
    }

    var candidates = Array.from(document.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
      'textarea:not([disabled]),[tabindex]:not([tabindex^="-"]),[role="button"],[role="link"]'
    )).filter(function(e) {
      var cs = window.getComputedStyle(e);
      // CAMBIO: Exigir > 3px para ignorar botones trampa (skip links) invisibles
      return cs.display !== 'none' && cs.visibility !== 'hidden' &&
             parseFloat(cs.opacity) > 0 && e.offsetWidth > 3 && e.offsetHeight > 3;
    });

    if (!candidates.length) return {moved:false, edge:dir};
    var cur = document.activeElement;
    if (dir === 'up' && (!cur || cur === document.body)) { return {moved:false, edge:dir}; }
    if (!cur || cur === document.body) { candidates[0].focus(); return {moved:true, edge:null}; }

    var cr = cur.getBoundingClientRect();
    var cx = cr.left + cr.width / 2;
    var cy = cr.top + cr.height / 2;

    var best = null;
    var bestScore = Infinity;

    for (var i = 0; i < candidates.length; i++) {
      var e = candidates[i];
      if (e === cur || e.contains(cur)) continue;

      var r = e.getBoundingClientRect();
      var ex = r.left + r.width / 2;
      var ey = r.top + r.height / 2;

      var vx = ex - cx;
      var vy = ey - cy;

      // CAMBIO: Tolerancia en píxeles para ignorar desalineaciones leves y evitar el ping-pong
      var TOL = 12;

      // Descarta todo lo que no esté CLARAMENTE en la dirección indicada
      switch (dir) {
        case 'up':
          if (vy >= -TOL) continue; 
          break;
        case 'down':
          if (vy <= TOL) continue;
          break;
        case 'left':
          if (vx >= -TOL) continue;
          break;
        case 'right':
          if (vx <= TOL) continue;
          break;
      }

      var forward;
      var sideways;

      switch (dir) {
        case 'up':
          forward = -vy;
          sideways = Math.abs(vx);
          break;
        case 'down':
          forward = vy;
          sideways = Math.abs(vx);
          break;
        case 'left':
          forward = -vx;
          sideways = Math.abs(vy);
          break;
        case 'right':
          forward = vx;
          sideways = Math.abs(vy);
          break;
      }

      // CAMBIO: Penalizamos más los movimientos diagonales (5 en vez de 3)
      var score = forward + sideways * 5;

      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }

    if (best) { 
      best.focus(); 
      best.scrollIntoView({ block: 'center', inline: 'center' }); 
      return {moved:true, edge:null}; 
    }
    
    // Si no encontró nada válido arriba, reporta el borde para que el Vue tome el control
    return {moved:false, edge:dir};
  } catch (err) {
    return {
        moved:false,
        edge:"error",
        error:String(err)
    };
  }
})();
`.trim()
}