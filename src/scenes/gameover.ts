import { SCREEN_W } from "../engine/constants";
import type { Game, Scene } from "../game/game";
import type { GameState } from "../game/state";
import { COLOR } from "../gfx/palettes";
import type { Renderer } from "../gfx/renderer";
import { PlayScene } from "./play";
import { TitleScene } from "./title";

const OPTIONS = ["CONTINUE", "QUIT"] as const;

export class GameOverScene implements Scene {
  private t = 0;
  private choice = 0;

  constructor(
    private readonly game: Game,
    private readonly state: GameState,
  ) {
    game.audio.playJingle("gameover");
  }

  update(): void {
    this.t++;
    if (this.t < 60) return;
    const input = this.game.input;
    if (input.wasPressed("up") || input.wasPressed("down")) {
      this.choice = (this.choice + 1) % OPTIONS.length;
      this.game.audio.sfx("text");
    }
    if (input.wasPressed("start") || input.wasPressed("a")) {
      this.game.audio.sfx("select");
      if (OPTIONS[this.choice] === "CONTINUE") {
        this.state.revive();
        this.game.setScene(new PlayScene(this.game, this.state));
      } else {
        this.game.setScene(new TitleScene(this.game));
      }
    }
  }

  draw(r: Renderer): void {
    r.clear(COLOR.black);
    r.textScaled("GAME OVER", SCREEN_W / 2 - (9 * 7 - 2), 70, 2, COLOR.red);
    if (this.t < 60) return;
    OPTIONS.forEach((label, i) => {
      const y = 130 + i * 18;
      r.text(label, 104, y, i === this.choice ? COLOR.white : COLOR.grey);
      if (i === this.choice) r.sprite("heart", 90, y);
    });
  }
}
