import { SCREEN_H, SCREEN_W } from "./engine/constants";
import { Game } from "./game/game";
import { GameState } from "./game/state";
import { PlayScene } from "./scenes/play";
import { TitleScene } from "./scenes/title";
import type { ItemKind } from "./world/types";
import { getRoom } from "./world/world";

const canvas = document.getElementById("screen") as HTMLCanvasElement;

/** Scale the canvas by the largest integer factor that fits the window. */
function fit(): void {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H)));
  canvas.style.width = `${SCREEN_W * scale}px`;
  canvas.style.height = `${SCREEN_H * scale}px`;
}
window.addEventListener("resize", fit);
fit();

const game = new Game(canvas);

/**
 * Dev-only shortcut for jumping straight into a room, e.g.
 * /?room=d_boss&x=4&y=5&items=sword,boomerang&hearts=5&keys=1&rupees=50
 */
function debugStart(params: URLSearchParams): PlayScene | null {
  const room = params.get("room");
  if (!room) return null;
  getRoom(room);
  const state = new GameState();
  const items = (params.get("items") ?? "").split(",") as ItemKind[];
  state.hasSword = items.includes("sword");
  state.hasBoomerang = items.includes("boomerang");
  state.maxHearts = Number(params.get("hearts") ?? 3);
  state.health = Number(params.get("health") ?? state.maxHealth);
  state.keys = Number(params.get("keys") ?? 0);
  state.rupees = Number(params.get("rupees") ?? 0);
  for (const flag of (params.get("flags") ?? "").split(",").filter(Boolean)) state.set(flag);
  const at = { x: Number(params.get("x") ?? 7.5), y: Number(params.get("y") ?? 7) };
  return new PlayScene(game, state, { room, at, facing: "up" });
}

const debug = import.meta.env.DEV ? debugStart(new URLSearchParams(location.search)) : null;
game.start(debug ?? new TitleScene(game));

if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
