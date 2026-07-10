function spatialNavImpl (dir) {
  if (!document.getElementById('gamepad-focus-style')) {
    var style = document.createElement('style')
    style.id = 'gamepad-focus-style'
    style.textContent = `
      *:focus {
        outline: 3px solid white !important;
        box-shadow: 0 0 0 6px black, 0 0 20px 8px #ff2255 !important;
        transform: scale(1.05) !important;
        transition: transform 0.1s ease-out, box-shadow 0.1s ease-out !important;
        z-index: 2147483647 !important;
        position: relative !important;
      }
    `
    document.head.appendChild(style)
  }

  var candidates = Array.from(document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex^="-"]), [role="button"], ' +
    '[role="link"], [role="menuitem"], [role="tab"], video, iframe, summary'
  )).filter(function (e) {
    var s = window.getComputedStyle(e)
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0 && e.offsetWidth > 0 && e.offsetHeight > 0
  })

  if (!candidates.length) return
  var cur = document.activeElement
  if (!cur || cur === document.body) { candidates[0].focus(); return }

  var cr = cur.getBoundingClientRect()
  var best = null, bestScore = Infinity

  for (var i = 0; i < candidates.length; i++) {
    var e = candidates[i]
    if (e === cur || e.contains(cur)) continue

    var r = e.getBoundingClientRect()
    var dx = 0, dy = 0, isValid = false

    if (dir === 'up') {
      isValid = r.bottom <= cr.top + 10
      dx = Math.max(0, Math.max(cr.left, r.left) - Math.min(cr.right, r.right))
      dy = cr.top - r.bottom
    } else if (dir === 'down') {
      isValid = r.top >= cr.bottom - 10
      dx = Math.max(0, Math.max(cr.left, r.left) - Math.min(cr.right, r.right))
      dy = r.top - cr.bottom
    } else if (dir === 'left') {
      isValid = r.right <= cr.left + 10
      dx = cr.left - r.right
      dy = Math.max(0, Math.max(cr.top, r.top) - Math.min(cr.bottom, r.bottom))
    } else if (dir === 'right') {
      isValid = r.left >= cr.right - 10
      dx = r.left - cr.right
      dy = Math.max(0, Math.max(cr.top, r.top) - Math.min(cr.bottom, r.bottom))
    }

    if (!isValid) continue

    var score = (dir === 'up' || dir === 'down') ? dy + (dx * 15) : dx + (dy * 15)

    if (score < bestScore) {
      bestScore = score
      best = e
    }
  }

  if (best) {
    best.focus()
    best.scrollIntoView({ block: 'center', inline: 'center' })
  }
}

var SPATIAL_NAV_IIFE = '(' + spatialNavImpl.toString() + ')'

function run (tabId, webviews, dir) {
  webviews.callAsync(tabId, 'executeJavaScript', SPATIAL_NAV_IIFE + '("' + dir + '")')
}

module.exports = { run }