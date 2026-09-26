import { SCREEN_H, SCREEN_W, TILE } from "../engine/constants";
import { Rng } from "../engine/math";
import type { Game, Scene } from "../game/game";
import { GameState } from "../game/state";
import { COLOR } from "../gfx/palettes";
import type { Renderer } from "../gfx/renderer";
import { PlayScene } from "./play";

interface Mote {
  x: number;
  y: number;
  vy: number;
  phase: number;
}

const TITLE = "MINI ZELDA";

/** Title screen with a little animated forest. */
export class TitleScene implements Scene {
  private t = 0;
  private motes: Mote[] = [];
  private starting = -1;

  constructor(private readonly game: Game) {
    const rng = new Rng(7);
    for (let i = 0; i < 24; i++) {
      this.motes.push({ x: rng.range(0, SCREEN_W), y: rng.range(0, SCREEN_H), vy: rng.range(0.15, 0.5), phase: rng.range(0, 6) });
    }
    game.audio.playMusic("title");
  }

  update(): void {
    this.t++;
    for (const m of this.motes) {
      m.y -= m.vy;
      if (m.y < -4) m.y = SCREEN_H + 4;
    }
    if (this.starting >= 0) {
      if (++this.starting > 40) this.game.setScene(new PlayScene(this.game, new GameState()));
      return;
    }
    const input = this.game.input;
    if (input.wasPressed("start") || input.wasPressed("a")) {
      this.game.audio.unlock();
      this.game.audio.stopMusic();
      this.game.audio.sfx("select");
      this.starting = 0;
    }
  }

  draw(r: Renderer): void {
    r.clear("#081020");
    // Distant hills and a line of trees at the bottom.
    for (let x = 0; x < SCREEN_W; x += TILE) {
      r.sprite("cliff", x, SCREEN_H - TILE * 3);
      r.sprite(x % 32 === 0 ? "grass_0" : "grass_1", x, SCREEN_H - TILE);
      r.sprite("grass_0", x, SCREEN_H - TILE * 2);
      r.sprite("tree", x, SCREEN_H - TILE * 2);
    }
    for (const m of this.motes) {
      const glow = Math.sin(this.t / 20 + m.phase) > 0;
      r.rect(m.x + Math.sin(this.t / 30 + m.phase) * 3, m.y, 1, 1, glow ? COLOR.yellow : "#5c6c3c");
    }

    const bob = Math.round(Math.sin(this.t / 30) * 2);
    r.spriteScaled(this.t % 90 < 6 ? "triforce_flash" : "triforce", SCREEN_W / 2 - 24, 22 + bob, 3);

    const scale = 3;
    const width = (TITLE.length * 7 - 2) * scale;
    r.textScaled(TITLE, SCREEN_W / 2 - width / 2 + 2, 80 + 2, scale, COLOR.darkRed);
    r.textScaled(TITLE, SCREEN_W / 2 - width / 2, 80, scale, COLOR.gold);
    r.textCentered("THE WORLD'S SMALLEST ADVENTURE", SCREEN_W / 2, 110, COLOR.lightGrey);

    if (this.starting < 0 ? this.t % 60 < 40 : this.starting % 4 < 2) {
      r.textCentered("PRESS ENTER", SCREEN_W / 2, 134, COLOR.white);
    }
    r.textCentered("ARROWS MOVE  Z SWORD  X ITEM", SCREEN_W / 2, 158, "#7c8ca8");
    r.textCentered("ENTER PAUSE  M MUTE", SCREEN_W / 2, 169, "#7c8ca8");

    if (this.starting >= 0) {
      r.withAlpha(Math.min(1, this.starting / 40), () => r.rect(0, 0, SCREEN_W, SCREEN_H, COLOR.black));
    }
  }
}
