import { describe, expect, it } from "vitest";
import { TILE } from "../src/engine/constants";
import { Enemy } from "../src/entities/enemies";
import { Pickup } from "../src/entities/pickup";
import { EndingScene } from "../src/scenes/ending";
import { GameOverScene } from "../src/scenes/gameover";
import { PlayScene } from "../src/scenes/play";
import { startPlay } from "./harness";

describe("gameplay", () => {
  it("walks into the cave and takes the sword", () => {
    const { game, state, scene } = startPlay();
    game.hold("up", 30);
    game.hold("left", 50);
    game.hold("up", 60);
    game.run(40); // fade
    expect(scene.room.id).toBe("cave_sword");
    game.run(200); // message types out
    game.hold("up", 30);
    expect(state.hasSword).toBe(true);
    expect(scene.player.holdTimer).toBeGreaterThan(0);
  });

  it("scrolls to the neighboring screen when walking off the edge", () => {
    const { game, scene } = startPlay({ room: "ow_start", at: { x: 13, y: 5 }, facing: "right" });
    game.hold("right", 60);
    game.run(80);
    expect(scene.room.id).toBe("ow_lake");
    expect(scene.player.x).toBeLessThan(TILE * 2);
  });

  it("the sword defeats an octorok", () => {
    const { game, state, scene } = startPlay({ room: "ow_lake", at: { x: 2, y: 3 }, facing: "right" }, (s) => {
      s.hasSword = true;
    });
    const octo = scene.entities.find((e): e is Enemy => e instanceof Enemy)!;
    octo.x = scene.player.x + 18;
    octo.y = scene.player.y;
    game.run(31); // let it finish spawning
    octo.x = scene.player.x + 18;
    octo.y = scene.player.y;
    octo.stun = 100;
    game.tap("a");
    game.run(10);
    expect(octo.dead).toBe(true);
    expect(state.enemiesDefeated).toBe(1);
  });

  it("taking damage knocks the player back and can end the game", () => {
    const { game, state, scene } = startPlay({ room: "ow_lake", at: { x: 2, y: 3 }, facing: "right" }, (s) => {
      s.health = 1;
    });
    scene.player.hurt(scene, 1, scene.player.cx + 10, scene.player.cy);
    expect(state.health).toBe(0);
    game.run(200);
    expect(game.scene).toBeInstanceOf(GameOverScene);
  });

  it("the boomerang fetches the key from the pit island", () => {
    const { game, state, scene } = startPlay({ room: "d_west", at: { x: 7, y: 8 }, facing: "up" }, (s) => {
      s.hasBoomerang = true;
    });
    // Remove the bats so they don't interfere.
    for (const e of scene.entities) if (e instanceof Enemy) e.dead = true;
    game.run(2);
    game.tap("up");
    game.tap("b");
    game.run(90);
    expect(state.keys).toBe(1);
    expect(state.has("got_dungeon_key")).toBe(true);
  });

  it("a key opens the locked door, which then stays open", () => {
    const { game, state, scene } = startPlay({ room: "d_entry", at: { x: 7.5, y: 3 }, facing: "up" }, (s) => {
      s.keys = 1;
      s.set("cleared:d_entry");
    });
    game.hold("up", 30);
    expect(state.keys).toBe(0);
    expect(scene.map.char(7, 1)).toBe("d");
    game.hold("up", 60);
    game.run(120);
    expect(scene.room.id).toBe("d_boss");
    expect(state.has("unlocked:d_boss:down")).toBe(true);
  });

  it("shutters close behind the player and open when the room is cleared", () => {
    const { game, scene } = startPlay({ room: "d_entry", at: { x: 12, y: 5 }, facing: "right" }, (s) => {
      s.set("cleared:d_entry");
    });
    game.hold("right", 50);
    game.run(120);
    expect(scene.room.id).toBe("d_east");
    expect(scene.map.char(0, 5)).toBe("#");
    for (const e of scene.entities) if (e instanceof Enemy) e.die(scene);
    game.run(2);
    expect(scene.map.char(0, 5)).toBe("d");
    expect(scene.entities.some((e) => e.constructor.name === "Chest")).toBe(true);
  });

  it("cutting the marked bush reveals the secret stairs", () => {
    const { game, state, scene } = startPlay({ room: "ow_woods", at: { x: 11, y: 5 }, facing: "up" }, (s) => {
      s.hasSword = true;
    });
    for (const e of scene.entities) if (e instanceof Enemy) e.dead = true;
    game.hold("up", 8);
    game.tap("a");
    game.run(20);
    expect(scene.map.char(11, 3)).toBe("S");
    expect(state.has("secret:ow_woods:11:3")).toBe(true);
  });

  it("shop items cost rupees", () => {
    const { game, state, scene } = startPlay({ room: "cave_shop", at: { x: 5.5, y: 8 }, facing: "up" }, (s) => {
      s.rupees = 12;
      s.health = 2;
    });
    game.run(200);
    game.hold("up", 40);
    expect(state.rupees).toBe(2);
    expect(state.health).toBe(state.maxHealth);
    expect(scene.entities.some((e) => e instanceof Pickup && e.item === "potion")).toBe(false);
  });

  it("picking up the Triforce ends the game", () => {
    const { game, state } = startPlay({ room: "d_triforce", at: { x: 7.5, y: 7 }, facing: "up" });
    game.hold("up", 60);
    expect(state.hasTriforce).toBe(true);
    game.run(400);
    expect(game.scene).toBeInstanceOf(EndingScene);
  });

  it("continuing after game over respawns with three hearts", () => {
    const { game, state, scene } = startPlay({ room: "d_boss", at: { x: 3, y: 5 }, facing: "up" }, (s) => {
      s.maxHearts = 5;
      s.health = 1;
    });
    scene.player.hurt(scene, 2, 0, 0);
    game.run(200);
    game.run(70);
    game.tap("start");
    expect(game.scene).toBeInstanceOf(PlayScene);
    const next = game.scene as PlayScene;
    expect(next.room.id).toBe("d_entry");
    expect(state.health).toBe(6);
    expect(state.deaths).toBe(1);
  });
});
