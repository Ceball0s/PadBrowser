var webviews = require('webviews.js')
var browserUI = require('browserUI.js')
//var tabs = require('tabState.js')
var tabEditor = require('navbar/tabEditor.js')
var searchbar = require('searchbar/searchbar.js')
var keyboardNavigationHelper = require('util/keyboardNavigationHelper.js')
var spatialNav = require('gamepad/spatialNav.js')
var virtualCursor = require('gamepad/virtualCursor.js')
var C = require('gamepad/constants.js')

function getTab () {
  var id = tabs.getSelected()
  return id || null
}
  
function dpad (dir) {
  virtualCursor.hide()
  var overlay = document.getElementById('task-overlay')
  if (overlay && !overlay.hidden) {
    keyboardNavigationHelper.moveFocus('taskOverlay', dir === 'up' ? -1 : 1)
    return
  }

  var a = document.activeElement
  if (!a || !document.contains(a) || a === document.body) {
    var tid = getTab()
    if (tid) spatialNav.run(tid, webviews, dir)
    else return
    return
  }

  var tag = a.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    if (dir === 'left') a.selectionStart = a.selectionEnd = Math.max(0, (a.selectionStart || 0) - 1)
    else if (dir === 'right') a.selectionStart = a.selectionEnd = Math.min((a.value || '').length, (a.selectionStart || 0) + 1)
  }

  if (dir === 'up') keyboardNavigationHelper.moveFocus('searchbar', -1)
  else if (dir === 'down') keyboardNavigationHelper.moveFocus('searchbar', 1)
}

function readLeftStick (gp) {
  var lx = gp.axes[0] || 0
  var ly = gp.axes[1] || 0
  if (Math.abs(lx) < C.LEFT_AXIS_DEAD) lx = 0
  if (Math.abs(ly) < C.LEFT_AXIS_DEAD) ly = 0
  if (lx === 0 && ly === 0) return

  virtualCursor.move(lx * C.MOUSE_SPEED, ly * C.MOUSE_SPEED)
}

function readRightStick (gp) {
  var rx = gp.axes[2] || 0
  var ry = gp.axes[3] || 0
  if (Math.abs(rx) < C.RIGHT_AXIS_DEAD) rx = 0
  if (Math.abs(ry) < C.RIGHT_AXIS_DEAD) ry = 0
  if (rx === 0 && ry === 0) return

  var id = getTab()
  if (!id) {
    return
  }

  var dx = Math.sign(rx) * Math.pow(Math.abs(rx), 1.5) * C.SCROLL_SPEED
  var dy = Math.sign(ry) * Math.pow(Math.abs(ry), 1.5) * C.SCROLL_SPEED
  webviews.callAsync(id, 'executeJavaScript',
    'window.scrollBy({left:' + Math.round(dx) + ',top:' + Math.round(dy) + '})'
  )
}


function btnA () {
  if (virtualCursor.isActive()) {
    virtualCursor.click()
    return
  }
  var a = document.activeElement
  if (!a) return
  if (a === tabEditor.input) searchbar.openURL(tabEditor.input.value, null)
  else a.click()
}

function btnB () { var id = getTab(); if (id) webviews.callAsync(id, 'executeJavaScript', 'window.history.back()') }
function btnX () { var id = getTab(); if (id) webviews.callAsync(id, 'executeJavaScript', 'window.history.forward()') }
function prevTab () { var idx = tabs.getIndex(tabs.getSelected()); if (idx === undefined) return; var p = tabs.getAtIndex(idx - 1) || tabs.getAtIndex(tabs.count() - 1); if (p) browserUI.switchToTab(p.id) }
function nextTab () { var idx = tabs.getIndex(tabs.getSelected()); if (idx === undefined) return; var n = tabs.getAtIndex(idx + 1) || tabs.getAtIndex(0); if (n) browserUI.switchToTab(n.id) }
function closeTab () { browserUI.closeTab(tabs.getSelected()) }
function addTab () { browserUI.addTab() }
function switchTask () { document.getElementById('switch-task-button').click() }

module.exports = {
  dpad, btnA, btnB, btnX, prevTab, nextTab, closeTab, addTab, switchTask,
  readLeftStick, readRightStick, getTab
}
