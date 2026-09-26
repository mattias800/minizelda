/** Size of one map tile in pixels. */
export const TILE = 16;
/** Room size in tiles (same as the NES original: 16x11). */
export const ROOM_COLS = 16;
export const ROOM_ROWS = 11;
export const ROOM_W = ROOM_COLS * TILE;
export const ROOM_H = ROOM_ROWS * TILE;
/** Height of the status bar at the top of the screen. */
export const HUD_H = 64;
/** Native resolution of the game. The canvas is scaled up with integer factors. */
export const SCREEN_W = ROOM_W;
export const SCREEN_H = HUD_H + ROOM_H;
/** The simulation runs at a fixed rate; all speeds are in pixels per frame. */
export const FPS = 60;
export const DT = 1 / FPS;
