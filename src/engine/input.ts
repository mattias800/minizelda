import type { Dir } from "./math";

export type Action = Dir | "a" | "b" | "start" | "mute";

const KEY_MAP: Record<string, Action> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  KeyZ: "a",
  KeyJ: "a",
  Space: "a",
  KeyX: "b",
  KeyK: "b",
  Enter: "start",
  Escape: "start",
  KeyP: "start",
  KeyM: "mute",
};

// Standard gamepad mapping: https://w3c.github.io/gamepad/#remapping
const PAD_BUTTONS: [number, Action][] = [
  [0, "a"],
  [2, "b"],
  [1, "b"],
  [9, "start"],
  [12, "up"],
  [13, "down"],
  [14, "left"],
  [15, "right"],
];

const DIRECTIONS: readonly Dir[] = ["up", "down", "left", "right"];

/**
 * Keyboard + gamepad input. Call {@link Input.endFrame} once per simulation step so
 * that "pressed" edges are only reported for a single step.
 */
export class Input {
  private held = new Set<Action>();
  private pressed = new Set<Action>();
  private padHeld = new Set<Action>();
  /** Most recently pressed direction first, so the newest key wins (NES-style 4-way movement). */
  private dirStack: Dir[] = [];
  private listeners: (() => void)[] = [];

  attach(target: Window): void {
    const down = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      if (!e.repeat) this.press(action);
    };
    const up = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      this.release(action);
    };
    const blur = () => {
      this.held.clear();
      this.dirStack = [];
    };
    target.addEventListener("keydown", down);
    target.addEventListener("keyup", up);
    target.addEventListener("blur", blur);
    this.listeners.push(
      () => target.removeEventListener("keydown", down),
      () => target.removeEventListener("keyup", up),
      () => target.removeEventListener("blur", blur),
    );
  }

  detach(): void {
    this.listeners.forEach((fn) => fn());
    this.listeners = [];
  }

  press(action: Action): void {
    if (!this.held.has(action)) this.pressed.add(action);
    this.held.add(action);
    if (isDir(action)) {
      this.dirStack = [action, ...this.dirStack.filter((d) => d !== action)];
    }
  }

  release(action: Action): void {
    this.held.delete(action);
    if (isDir(action)) this.dirStack = this.dirStack.filter((d) => d !== action);
  }

  /** Polls connected gamepads. Called once per rendered frame. */
  pollGamepads(): void {
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
    const now = new Set<Action>();
    for (const pad of pads) {
      if (!pad) continue;
      for (const [index, action] of PAD_BUTTONS) {
        if (pad.buttons[index]?.pressed) now.add(action);
      }
      const [ax = 0, ay = 0] = pad.axes;
      if (ax < -0.5) now.add("left");
      if (ax > 0.5) now.add("right");
      if (ay < -0.5) now.add("up");
      if (ay > 0.5) now.add("down");
    }
    for (const action of now) if (!this.padHeld.has(action)) this.press(action);
    for (const action of this.padHeld) if (!now.has(action)) this.release(action);
    this.padHeld = now;
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  /** The direction the player is currently pushing, if any. */
  direction(): Dir | null {
    return this.dirStack.find((d) => this.held.has(d)) ?? null;
  }

  endFrame(): void {
    this.pressed.clear();
  }
}

function isDir(action: Action): action is Dir {
  return (DIRECTIONS as readonly string[]).includes(action);
}
