var webviews = require('webviews.js')
var tabs = require('tabState.js')

var x = 0
var y = 0
var visible = false
var hideTimeout = null
var HIDE_DELAY = 1500

function getTab () {
  var id = tabs.getSelected()
  return id
}

function getBounds () {
  var b = webviews.getViewBounds()
  return b
}

// se serializa con toString() e inyecta en el contexto de la página, igual que spatialNav
function cursorInjectImpl (px, py, vis) {
  var c = document.getElementById('__gamepad_virtual_cursor__')
  if (!c) {
    var style = document.createElement('style')
    style.id = '__gamepad_virtual_cursor_style__'
    style.textContent = '#__gamepad_virtual_cursor__{position:fixed;top:0;left:0;width:28px;height:28px;pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .15s;will-change:transform;}'
    document.head.appendChild(style)

    c = document.createElement('div')
    c.id = '__gamepad_virtual_cursor__'
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><polygon points="3,3 21,13 15,14 18.5,23 16,24 12.5,17 3,21" fill="white" stroke="#222" stroke-width="1.8" stroke-linejoin="round"/></svg>'
    document.documentElement.appendChild(c)
  }

  c.style.transform = 'translate(' + px + 'px,' + py + 'px)'
  c.style.opacity = vis ? '1' : '0'
}

var CURSOR_INJECT_IIFE = '(' + cursorInjectImpl.toString() + ')'

function sendCursorUpdate () {
  var id = getTab()
  if (!id) {
    return
  }
  var js = CURSOR_INJECT_IIFE + '(' + Math.round(x) + ',' + Math.round(y) + ',' + (visible ? 1 : 0) + ')'
  webviews.callAsync(id, 'executeJavaScript', js)
}

function reset () {
  var b = getBounds()
  if (!b) {
    return
  }
  x = Math.round(b.width / 2)
  y = Math.round(b.height / 2)
  sendCursorUpdate()
}

function show () {
  visible = true
  sendCursorUpdate()
  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = setTimeout(hide, HIDE_DELAY)
}

function hide () {
  visible = false
  sendCursorUpdate()
}

function move (dx, dy) {
  var b = getBounds()
  if (!b) {
    return
  }

  var oldX = x
  var oldY = y
  x = Math.max(0, Math.min(b.width, x + dx))
  y = Math.max(0, Math.min(b.height, y + dy))

  var id = getTab()
  if (id) {
    webviews.callAsync(id, 'sendInputEvent', {
      type: 'mouseMove',
      x: Math.round(x),
      y: Math.round(y)
    })
  } else {
  }

  show()
}

function click () {
  var id = getTab()
  if (!id) {
    return
  }

  var pos = { x: Math.round(x), y: Math.round(y) }

  webviews.callAsync(id, 'sendInputEvent', Object.assign({ type: 'mouseDown', button: 'left', clickCount: 1 }, pos))
  webviews.callAsync(id, 'sendInputEvent', Object.assign({ type: 'mouseUp', button: 'left', clickCount: 1 }, pos))
}

function onDomReady (tabId) {
  if (tabId === tabs.getSelected()) {
    reset()
  }
}

function isActive () {
  return visible
}

module.exports = {
  move: move,
  click: click,
  reset: reset,
  show: show,
  hide: hide,
  onDomReady: onDomReady,
  isActive: isActive,
  isVisible: isActive
}