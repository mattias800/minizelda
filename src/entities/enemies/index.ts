import type { EnemyKind } from "../../world/types";
import { Dragon } from "./dragon";
import type { Enemy } from "./enemy";
import { Keese } from "./keese";
import { Octorok } from "./octorok";
import { Stalfos } from "./stalfos";
import { Tektite } from "./tektite";

export { Enemy } from "./enemy";

/** Creates an enemy with its sprite's top-left at room pixel (x, y). */
export function createEnemy(kind: EnemyKind, x: number, y: number): Enemy {
  switch (kind) {
    case "octorok_red":
      return new Octorok(x, y, "red");
    case "octorok_blue":
      return new Octorok(x, y, "blue");
    case "tektite":
      return new Tektite(x, y);
    case "keese":
      return new Keese(x, y);
    case "stalfos":
      return new Stalfos(x, y);
    case "dragon":
      return new Dragon(x, y);
  }
}
