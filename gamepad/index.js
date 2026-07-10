var C = require('gamepad/constants.js')
var mapping = require('gamepad/mapping.js')
var virtualCursor = require('gamepad/virtualCursor.js')
var webviews = require('webviews.js')

webviews.bindEvent('dom-ready', function (tabId) {
  virtualCursor.onDomReady(tabId)
})

var gamepadId = null
var frameId = null
var prevBtn = {}
var lastTrig = {}
var l1r1Lock = 0

function canTrig (i) {
  var now = performance.now()
  var cd = C.CD.D_PAD

  if (i === C.B.L1 || i === C.B.R1 || i === C.B.L2 || i === C.B.R2) cd = C.CD.TRIGGER
  else if (i === C.B.A || i === C.B.B || i === C.B.X || i === C.B.L3) cd = C.CD.ACTION

  if (lastTrig[i] && now - lastTrig[i] < cd) return false
  if (now < l1r1Lock && ((i === C.B.L1 && prevBtn[C.B.R1]) || (i === C.B.R1 && prevBtn[C.B.L1]))) return false

  lastTrig[i] = now
  if (i === C.B.L1 || i === C.B.R1) l1r1Lock = now + C.L1_R1_EXCLUSION
  return true
}

function poll () {
  var pads = navigator.getGamepads()
  if (!pads) {
    return
  }
  var gp = pads[gamepadId]
  if (!gp) {
    return
  }

  for (var i = 0; i < gp.buttons.length; i++) {
    var pressed = gp.buttons[i].pressed
    var was = prevBtn[i]

    if (pressed && !was && canTrig(i)) {
      switch (i) {
        case C.B.DPAD_UP:    mapping.dpad('up'); break
        case C.B.DPAD_DOWN:  mapping.dpad('down'); break
        case C.B.DPAD_LEFT:  mapping.dpad('left'); break
        case C.B.DPAD_RIGHT: mapping.dpad('right'); break
        case C.B.A:          mapping.btnA(); break
        case C.B.B:          mapping.btnB(); break
        case C.B.X:          mapping.btnX(); break
        case C.B.L1:         mapping.prevTab(); break
        case C.B.R1:         mapping.nextTab(); break
        case C.B.L2:         mapping.closeTab(); break
        case C.B.R2:         mapping.addTab(); break
        case C.B.L3:         mapping.btnA(); break
        case C.B.SELECT:     mapping.switchTask(); break
        case C.B.START: break
      }
    }
    prevBtn[i] = pressed
  }

  mapping.readLeftStick(gp)
  mapping.readRightStick(gp)
}

function loop () {
  try {
    if (gamepadId !== null) poll()
  } catch (e) {
    console.error('[GAMEPAD:loop] error:', e.stack || e.message)
  } finally {
    frameId = requestAnimationFrame(loop)
  }
}

module.exports = {
  initialize: function () {
    window.addEventListener('gamepadconnected', function (e) {
      gamepadId = e.gamepad.index
      virtualCursor.reset()
      if (!frameId) loop()
    })

    window.addEventListener('gamepaddisconnected', function (e) {
      if (e.gamepad.index === gamepadId) gamepadId = null
    })

    var pads = navigator.getGamepads()
    for (var i = 0; i < (pads ? pads.length : 0); i++) {
      if (pads[i]) {
        gamepadId = pads[i].index
        break
      }
    }

    if (gamepadId !== null) {
      loop()
    } else {
    }
  }
}
