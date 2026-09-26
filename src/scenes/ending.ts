import { SCREEN_H, SCREEN_W } from "../engine/constants";
import type { Game, Scene } from "../game/game";
import type { GameState } from "../game/state";
import { COLOR } from "../gfx/palettes";
import type { Renderer } from "../gfx/renderer";
import { TitleScene } from "./title";

function formatTime(frames: number): string {
  const total = Math.floor(frames / 60);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** The credits: short and sweet, like the world. */
export class EndingScene implements Scene {
  private t = 0;
  private readonly lines: [string, string][];

  constructor(
    private readonly game: Game,
    state: GameState,
  ) {
    game.audio.playMusic("ending");
    const stats: [string, string][] = [
      ["TIME", formatTime(state.frames)],
      ["DEATHS", String(state.deaths)],
      ["DEFEATED", String(state.enemiesDefeated)],
      ["HEARTS", String(state.maxHearts)],
      ["RUPEES", String(state.rupees)],
    ];
    this.lines = [
      ["CONGRATULATIONS!", COLOR.gold],
      ["", ""],
      ["YOU RECOVERED THE TRIFORCE", COLOR.white],
      ["AND SAVED THE SMALLEST", COLOR.white],
      ["KINGDOM IN THE WORLD.", COLOR.white],
      ["", ""],
      // Fixed-width rows so the centered stats line up in columns.
      ...stats.map(([label, value]): [string, string] => [label.padEnd(10) + value.padStart(6), COLOR.lightGrey]),
      ["", ""],
      ["THANKS FOR PLAYING!", COLOR.green],
    ];
  }

  update(): void {
    this.t++;
    if (this.t > 120 && (this.game.input.wasPressed("start") || this.game.input.wasPressed("a"))) {
      this.game.audio.stopMusic();
      this.game.setScene(new TitleScene(this.game));
    }
  }

  draw(r: Renderer): void {
    r.clear(COLOR.black);
    const bob = Math.round(Math.sin(this.t / 25) * 2);
    // The hero holding the Triforce aloft, drawn at double size.
    r.spriteScaled("hero_down_1", SCREEN_W / 2 - 16, 30, 2);
    r.spriteScaled("triforce", SCREEN_W / 2 - 16, 4 + bob, 2);
    r.spriteScaled("hand", SCREEN_W / 2 - 22, 26, 2);
    r.spriteScaled("hand", SCREEN_W / 2 + 14, 26, 2);
    const shown = Math.min(this.lines.length, Math.floor(this.t / 20));
    this.lines.slice(0, shown).forEach(([text, color], i) => {
      if (text) r.textCentered(text, SCREEN_W / 2, 72 + i * 11, color);
    });
    if (this.t > 120 && this.t % 60 < 40) r.textCentered("PRESS ENTER", SCREEN_W / 2, SCREEN_H - 16, COLOR.grey);
  }
}
