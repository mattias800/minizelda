import { AudioEngine } from "../src/audio/audio";
import { Input, type Action } from "../src/engine/input";
import type { Game, Scene } from "../src/game/game";
import { GameState } from "../src/game/state";
import { PlayScene } from "../src/scenes/play";
import type { Destination } from "../src/world/types";

/** A headless stand-in for Game: real input and (silent) audio, no canvas or animation loop. */
export class TestGame {
  readonly input = new Input();
  readonly audio = new AudioEngine();
  scene?: Scene;

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  asGame(): Game {
    return this as unknown as Game;
  }

  /** Runs `frames` simulation steps. */
  run(frames: number): void {
    for (let i = 0; i < frames; i++) {
      this.scene!.update();
      this.input.endFrame();
    }
  }

  hold(action: Action, frames: number): void {
    this.input.press(action);
    this.run(frames);
    this.input.release(action);
  }

  tap(action: Action): void {
    this.hold(action, 1);
  }
}

export function startPlay(dest?: Destination, setup?: (s: GameState) => void) {
  const game = new TestGame();
  const state = new GameState();
  setup?.(state);
  const scene = new PlayScene(game.asGame(), state, dest);
  game.setScene(scene);
  return { game, state, scene };
}
