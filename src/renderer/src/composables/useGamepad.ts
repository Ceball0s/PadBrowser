export interface GamepadHandlers {
  onDpad: (dir: 'up' | 'down' | 'left' | 'right') => void
  onL1: () => void
  onR1: () => void
  onL2: () => void
  onR2: () => void
  onSelect: () => void
  onA: () => void
  onB: () => void
  onX: () => void
  onY: () => void
  onLeftStick?: (dx: number, dy: number) => void
  onRightStick?: (dx: number, dy: number) => void
}

const B: Record<string, number> = {
  A: 0, B: 1, X: 2, Y: 3,
  L1: 4, R1: 5, L2: 6, R2: 7,
  SELECT: 8, START: 9, L3: 10, R3: 11,
  DPAD_UP: 12, DPAD_DOWN: 13, DPAD_LEFT: 14, DPAD_RIGHT: 15
}

const CD = { D_PAD: 150, ACTION: 150, TRIGGER: 300 }
const L1_R1_EXCLUSION = 200
const LEFT_AXIS_DEAD = 0.2
const MOUSE_SPEED = 12
const RIGHT_AXIS_DEAD = 0.3
const SCROLL_SPEED = 15

const DPAD_MAP: Record<number, 'up' | 'down' | 'left' | 'right'> = {
  [B.DPAD_UP]: 'up',
  [B.DPAD_DOWN]: 'down',
  [B.DPAD_LEFT]: 'left',
  [B.DPAD_RIGHT]: 'right'
}

const BUTTON_HANDLER: Record<number, keyof GamepadHandlers> = {
  [B.A]: 'onA',
  [B.B]: 'onB',
  [B.X]: 'onX',
  [B.Y]: 'onY',
  [B.L1]: 'onL1',
  [B.R1]: 'onR1',
  [B.L2]: 'onL2',
  [B.R2]: 'onR2',
  [B.SELECT]: 'onSelect'
}

export function useGamepad(handlers: Partial<GamepadHandlers>): () => void {
  let gamepadId: number | null = null
  let frameId: number | null = null
  const prevBtn: Record<number, boolean> = {}
  const lastTrig: Record<number, number> = {}
  let l1r1Lock = 0

  function canTrig(i: number): boolean {
    const now = performance.now()
    let cd = CD.D_PAD
    if (i === B.L1 || i === B.R1 || i === B.L2 || i === B.R2) cd = CD.TRIGGER
    else if (i === B.A || i === B.B || i === B.X || i === B.L3) cd = CD.ACTION

    if (lastTrig[i] && now - lastTrig[i] < cd) return false
    if (now < l1r1Lock && ((i === B.L1 && prevBtn[B.R1]) || (i === B.R1 && prevBtn[B.L1]))) return false

    lastTrig[i] = now
    if (i === B.L1 || i === B.R1) l1r1Lock = now + L1_R1_EXCLUSION
    return true
  }

  function poll(): void {
    const pads = navigator.getGamepads()
    if (!pads) return
    const gp = pads[gamepadId!]
    if (!gp) return

    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed
      const was = prevBtn[i]

      if (pressed && !was && canTrig(i)) {
        if (i in DPAD_MAP) {
          handlers.onDpad?.(DPAD_MAP[i])
        } else {
          const handlerName = BUTTON_HANDLER[i]
          if (handlerName) handlers[handlerName]?.()
        }
      }
      prevBtn[i] = pressed
    }

    if (handlers.onLeftStick && gp.axes.length >= 2) {
      let lx = gp.axes[0] || 0
      let ly = gp.axes[1] || 0
      if (Math.abs(lx) < LEFT_AXIS_DEAD) lx = 0
      if (Math.abs(ly) < LEFT_AXIS_DEAD) ly = 0
      if (lx !== 0 || ly !== 0) {
        const dx = Math.sign(lx) * Math.pow(Math.abs(lx), 1.5) * MOUSE_SPEED
        const dy = Math.sign(ly) * Math.pow(Math.abs(ly), 1.5) * MOUSE_SPEED
        handlers.onLeftStick(Math.round(dx), Math.round(dy))
      }
    }

    if (handlers.onRightStick && gp.axes.length >= 4) {
      let rx = gp.axes[2] || 0
      let ry = gp.axes[3] || 0
      if (Math.abs(rx) < RIGHT_AXIS_DEAD) rx = 0
      if (Math.abs(ry) < RIGHT_AXIS_DEAD) ry = 0
      if (rx !== 0 || ry !== 0) {
        const dx = Math.sign(rx) * Math.pow(Math.abs(rx), 1.5) * SCROLL_SPEED
        const dy = Math.sign(ry) * Math.pow(Math.abs(ry), 1.5) * SCROLL_SPEED
        handlers.onRightStick(Math.round(dx), Math.round(dy))
      }
    }
  }

  function loop(): void {
    try {
      if (gamepadId !== null) poll()
    } catch {
      // ignore polling errors
    } finally {
      if (frameId !== null) cancelAnimationFrame(frameId) 
      frameId = requestAnimationFrame(loop)
    }
  }

  function onConnected(e: GamepadEvent): void {
    gamepadId = e.gamepad.index
    if (!frameId) loop()
  }

  function onDisconnected(e: GamepadEvent): void {
    if (e.gamepad.index === gamepadId) gamepadId = null
  }

  window.addEventListener('gamepadconnected', onConnected)
  window.addEventListener('gamepaddisconnected', onDisconnected)

  const pads = navigator.getGamepads()
  for (let i = 0; i < (pads ? pads.length : 0); i++) {
    if (pads[i]) {
      gamepadId = pads[i].index
      break
    }
  }
  if (gamepadId !== null) loop()

  return function stop(): void {
    window.removeEventListener('gamepadconnected', onConnected)
    window.removeEventListener('gamepaddisconnected', onDisconnected)
    if (frameId !== null) cancelAnimationFrame(frameId)
  }
}
