import { HUD_H, ROOM_H, SCREEN_W } from "../engine/constants";
import type { GameState } from "../game/state";
import { COLOR } from "../gfx/palettes";
import type { Renderer } from "../gfx/renderer";

const CONTROLS: [string, string][] = [
  ["ARROWS / WASD", "MOVE"],
  ["Z / SPACE / J", "SWORD"],
  ["X / K", "ITEM"],
  ["ENTER / ESC", "PAUSE"],
  ["M", "MUTE"],
];

/** Inventory / help overlay shown while paused. */
export function drawPauseScreen(r: Renderer, state: GameState): void {
  const x = 16;
  const y = HUD_H + 8;
  const w = SCREEN_W - 32;
  const h = ROOM_H - 16;
  r.withAlpha(0.9, () => r.rect(x, y, w, h, COLOR.black));
  r.strokeRect(x, y, w, h, COLOR.blue);
  r.textCentered("- PAUSED -", SCREEN_W / 2, y + 8, COLOR.red);

  r.text("INVENTORY", x + 12, y + 24, COLOR.yellow);
  const items: [boolean, string, string][] = [
    [state.hasSword, "sword_up", "SWORD"],
    [state.hasBoomerang, "boomerang_0", "BOOMERANG"],
    [state.hasTriforce, "triforce", "TRIFORCE"],
  ];
  items.forEach(([has, sprite, label], i) => {
    const cx = x + 40 + i * 72;
    if (has) {
      const { w: sw, h: sh } = r.sprites.size(sprite);
      r.sprite(sprite, cx - sw / 2, y + 48 - sh / 2);
      r.textCentered(label, cx, y + 62, COLOR.white);
    } else {
      r.textCentered("?", cx, y + 45, COLOR.darkGrey);
    }
  });

  r.text("CONTROLS", x + 12, y + 82, COLOR.yellow);
  CONTROLS.forEach(([keys, action], i) => {
    r.text(keys, x + 20, y + 96 + i * 11, COLOR.lightGrey);
    r.text(action, x + 150, y + 96 + i * 11, COLOR.white);
  });
}
