import { AudioEngine } from "../audio/audio";
import { DT } from "../engine/constants";
import { Input } from "../engine/input";
import { Renderer } from "../gfx/renderer";

export interface Scene {
  /** Advances one fixed simulation step (1/60 s). */
  update(): void;
  draw(r: Renderer): void;
}

const MAX_STEPS_PER_FRAME = 5;

/** Owns the shared services and runs the active scene at a fixed timestep. */
export class Game {
  readonly input = new Input();
  readonly audio = new AudioEngine();
  readonly renderer: Renderer;
  private scene!: Scene;
  private last = 0;
  private acc = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas.getContext("2d")!);
    this.input.attach(window);
    // Browsers only allow audio after a user gesture.
    const unlock = () => this.audio.unlock();
    window.addEventListener("keydown", unlock);
    window.addEventListener("pointerdown", unlock);
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  start(scene: Scene): void {
    this.scene = scene;
    if (this.running) return;
    this.running = true;
    requestAnimationFrame((t) => {
      this.last = t;
      this.frame(t);
    });
  }

  /** Runs `n` simulation steps immediately. Used by tests and debug tools. */
  step(n = 1): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  private frame(now: number): void {
    this.acc += Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    this.input.pollGamepads();
    let steps = 0;
    while (this.acc >= DT && steps < MAX_STEPS_PER_FRAME) {
      this.tick();
      this.acc -= DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) this.acc = 0;
    this.scene.draw(this.renderer);
    requestAnimationFrame((t) => this.frame(t));
  }

  private tick(): void {
    if (this.input.wasPressed("mute")) this.audio.toggleMute();
    this.scene.update();
    this.input.endFrame();
  }
}
