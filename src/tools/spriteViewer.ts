// Dev tool: renders sprites in a grid. Open /sprites.html while running `npm run dev`.
// Optional query params: ?filter=hero (substring match) and ?scale=6.
import { ALL_ART } from "../gfx/art";
import { Renderer } from "../gfx/renderer";

const params = new URLSearchParams(location.search);
const filter = params.get("filter") ?? "";
const scale = Number(params.get("scale") ?? 3);
const names = Object.keys(ALL_ART).filter((n) => filter.split(",").some((f) => n.includes(f)));
const CELL = 40;
const COLS = 16;
const canvas = document.getElementById("c") as HTMLCanvasElement;
canvas.width = COLS * CELL;
canvas.height = Math.ceil(names.length / COLS) * (CELL + 8) + 16;
canvas.style.width = `${canvas.width * scale}px`;
canvas.style.height = `${canvas.height * scale}px`;
const r = new Renderer(canvas.getContext("2d")!);
r.clear("#3a3a4a");
names.forEach((name, i) => {
  const x = (i % COLS) * CELL + 4;
  const y = Math.floor(i / COLS) * (CELL + 8) + 4;
  r.rect(x - 1, y - 1, 34, 34, "#5aa83c");
  r.sprite(name, x, y);
  r.text(name.replace(/_/g, "").slice(0, 5), x, y + 35, "#fcfcfc");
});
