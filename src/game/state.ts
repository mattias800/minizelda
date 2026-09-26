import type { Destination } from "../world/types";
import { START_POS, START_ROOM } from "../world/world";

/** Health is counted in half hearts, like the original. */
export const HALF_HEARTS_PER_HEART = 2;
export const MAX_HEARTS_CAP = 16;

/** Everything about a play-through that survives room changes and continues. */
export class GameState {
  maxHearts = 3;
  health = 3 * HALF_HEARTS_PER_HEART;
  rupees = 0;
  keys = 0;
  hasSword = false;
  hasBoomerang = false;
  hasTriforce = false;
  /** One-time events: collected items, opened doors, revealed secrets, cleared rooms. */
  readonly flags = new Set<string>();
  /** Rooms of the dungeon the player has visited (for the map). */
  readonly visited = new Set<string>();
  respawn: Destination = { room: START_ROOM, at: START_POS, facing: "down" };

  frames = 0;
  deaths = 0;
  enemiesDefeated = 0;

  get maxHealth(): number {
    return this.maxHearts * HALF_HEARTS_PER_HEART;
  }

  get isFullHealth(): boolean {
    return this.health >= this.maxHealth;
  }

  heal(halfHearts: number): void {
    this.health = Math.min(this.maxHealth, this.health + halfHearts);
  }

  damage(halfHearts: number): void {
    this.health = Math.max(0, this.health - halfHearts);
  }

  addHeartContainer(): void {
    this.maxHearts = Math.min(MAX_HEARTS_CAP, this.maxHearts + 1);
    this.health = this.maxHealth;
  }

  addRupees(n: number): void {
    this.rupees = Math.max(0, Math.min(255, this.rupees + n));
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  set(flag: string): void {
    this.flags.add(flag);
  }

  /** Called when continuing after a game over. */
  revive(): void {
    this.health = 3 * HALF_HEARTS_PER_HEART;
    this.deaths++;
  }
}
