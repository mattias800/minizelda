import { describe, expect, it } from "vitest";
import { Enemy } from "../src/entities/enemies";
import { Dragon } from "../src/entities/enemies/dragon";
import { Octorok } from "../src/entities/enemies/octorok";
import { Fireball, Rock } from "../src/entities/projectiles";
import { startPlay } from "./harness";

function clearEnemies(entities: readonly unknown[]): void {
  for (const e of entities) if (e instanceof Enemy) e.dead = true;
}

describe("combat", () => {
  it("the shield blocks rocks coming from the front", () => {
    const { game, state, scene } = startPlay({ room: "ow_start", at: { x: 7, y: 5 }, facing: "up" });
    const p = scene.player;
    p.dir = "right";
    scene.spawn(new Rock(p.cx + 30, p.cy, "left"));
    game.run(20);
    expect(state.health).toBe(state.maxHealth);
  });

  it("rocks hurt when hitting the player from behind", () => {
    const { game, state, scene } = startPlay({ room: "ow_start", at: { x: 7, y: 5 }, facing: "up" });
    const p = scene.player;
    p.dir = "left";
    scene.spawn(new Rock(p.cx + 30, p.cy, "left"));
    game.run(20);
    expect(state.health).toBe(state.maxHealth - 1);
  });

  it("fireballs can't be blocked", () => {
    const { game, state, scene } = startPlay({ room: "ow_start", at: { x: 7, y: 5 }, facing: "up" });
    const p = scene.player;
    p.dir = "right";
    scene.spawn(new Fireball(p.cx + 30, p.cy, -2, 0));
    game.run(20);
    expect(state.health).toBe(state.maxHealth - 1);
  });

  it("the dragon takes six sword hits", () => {
    const { game, scene } = startPlay({ room: "d_boss", at: { x: 3, y: 5 }, facing: "up" }, (s) => {
      s.hasSword = true;
      s.health = 1; // no sword beams
      s.maxHearts = 16;
    });
    const dragon = scene.entities.find((e): e is Dragon => e instanceof Dragon)!;
    game.run(31); // materialize
    let hits = 0;
    while (!dragon.dead && hits < 10) {
      dragon.invuln = 0;
      expect(dragon.hurt(scene, { amount: 1, push: "right" })).toBe(true);
      hits++;
      game.run(1);
    }
    expect(hits).toBe(6);
    expect(dragon.dead).toBe(true);
  });

  it("the boomerang stuns octoroks", () => {
    const { game, scene } = startPlay({ room: "ow_lake", at: { x: 2, y: 3 }, facing: "right" }, (s) => {
      s.hasBoomerang = true;
    });
    clearEnemies(scene.entities);
    game.run(1);
    const octo = new Octorok(scene.player.x + 40, scene.player.y, "red");
    scene.spawn(octo);
    game.run(31);
    octo.x = scene.player.x + 40;
    octo.y = scene.player.y;
    game.tap("b");
    game.run(15);
    expect(octo.stun).toBeGreaterThan(0);
    expect(octo.dead).toBe(false);
  });
});
