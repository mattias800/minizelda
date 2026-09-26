import { HUD_H, SCREEN_W } from "../engine/constants";
import type { Renderer } from "../gfx/renderer";
import { COLOR } from "../gfx/palettes";
import { clearedFlag } from "../game/room";
import type { GameState } from "../game/state";
import type { RoomDef } from "../world/types";
import { getRoom, roomsInArea } from "../world/world";

const MAP_X = 16;
const MAP_Y = 16;
const MAP_W = 64;
const MAP_H = 32;

/** The status bar: map, rupees, keys, equipped items and life. */
export function drawHud(r: Renderer, state: GameState, room: RoomDef, frame: number): void {
  r.rect(0, 0, SCREEN_W, HUD_H, COLOR.black);
  drawMinimap(r, state, room, frame);

  r.sprite("icon_rupee", 90, 16);
  r.text(`X${state.rupees}`, 98, 16);
  r.sprite("icon_key", 90, 28);
  r.text(`X${state.keys}`, 98, 29);

  drawItemBox(r, 128, "B", state.hasBoomerang ? "boomerang_0" : null);
  drawItemBox(r, 152, "A", state.hasSword ? "sword_up" : null);

  r.textCentered("-LIFE-", 212, 12, COLOR.red);
  for (let i = 0; i < state.maxHearts; i++) {
    const x = 180 + (i % 8) * 8;
    const y = 32 - Math.floor(i / 8) * 8;
    const hp = state.health - i * 2;
    r.sprite(hp >= 2 ? "heart" : hp === 1 ? "heart_half" : "heart_empty", x, y);
  }
  if (state.hasTriforce) r.sprite("triforce", 212, 44);
}

function drawItemBox(r: Renderer, x: number, label: string, sprite: string | null): void {
  r.strokeRect(x, 14, 16, 26, COLOR.blue);
  r.rect(x + 5, 10, 7, 8, COLOR.black);
  r.text(label, x + 6, 10);
  if (sprite) {
    const { w, h } = r.sprites.size(sprite);
    r.sprite(sprite, x + 8 - w / 2, 28 - h / 2 + 1);
  }
}

/** Overworld: grey box with a blinking dot. Dungeon: room layout with a compass marker. */
function drawMinimap(r: Renderer, state: GameState, room: RoomDef, frame: number): void {
  const blink = frame % 32 < 20;
  if (room.area === "dungeon") {
    r.text("LEVEL-1", MAP_X, 5);
    const rooms = roomsInArea("dungeon");
    const cellW = 16;
    const cellH = 10;
    for (const d of rooms) {
      const x = MAP_X + 8 + d.gx * cellW;
      const y = MAP_Y + 2 + d.gy * cellH;
      r.rect(x + 1, y + 1, cellW - 2, cellH - 2, state.visited.has(d.id) ? "#3c84b8" : "#1c3c58");
      if (d.enemies?.some((e) => e.kind === "dragon") && !state.has(clearedFlag(d.id)) && blink) {
        r.rect(x + cellW / 2 - 2, y + cellH / 2 - 2, 4, 4, COLOR.red);
      }
      if (d.id === room.id && blink) r.rect(x + cellW / 2 - 2, y + cellH / 2 - 2, 4, 4, COLOR.green);
    }
    return;
  }
  // Caves count as the overworld room their exit leads to.
  const where = room.area === "overworld" ? room : getRoom(room.exits?.down?.room ?? room.id);
  r.rect(MAP_X, MAP_Y, MAP_W, MAP_H, "#747474");
  if (blink) r.rect(MAP_X + where.gx * 32 + 14, MAP_Y + where.gy * 16 + 6, 4, 4, COLOR.green);
}
