import { TILE } from "../engine/constants";
import type { Renderer } from "../gfx/renderer";
import { ALL_ART } from "../gfx/art";
import { textWidth } from "../gfx/font";
import type { ItemKind } from "../world/types";
import { Entity } from "./entity";
import type { World } from "./world";

export const ITEM_SPRITE: Record<ItemKind, string> = {
  sword: "sword_up",
  boomerang: "boomerang_0",
  key: "key",
  heart: "heart",
  heart_container: "heart_container",
  rupee: "rupee",
  rupee_blue: "rupee_blue",
  rupee_gift: "rupee_blue",
  potion: "potion",
  triforce: "triforce",
};

export const ITEM_NAME: Record<ItemKind, string> = {
  sword: "WOODEN SWORD",
  boomerang: "BOOMERANG",
  key: "SMALL KEY",
  heart: "HEART",
  heart_container: "HEART CONTAINER",
  rupee: "RUPEE",
  rupee_blue: "5 RUPEES",
  rupee_gift: "30 RUPEES",
  potion: "LIFE POTION",
  triforce: "TRIFORCE",
};

/** Items that trigger the "hold it over your head" moment. */
export const MAJOR_ITEMS: ReadonlySet<ItemKind> = new Set([
  "sword",
  "boomerang",
  "heart_container",
  "rupee_gift",
  "triforce",
]);

const DROP_LIFETIME = 9 * 60;

export interface PickupOptions {
  price?: number;
  flag?: string;
  lifetime?: number;
}

/** An item lying in the world. */
export class Pickup extends Entity {
  readonly price?: number;
  readonly flag?: string;
  private lifetime?: number;
  private age = 0;
  /** Set while the boomerang is dragging this item back to the player. */
  carried = false;

  constructor(
    readonly item: ItemKind,
    cx: number,
    cy: number,
    opts: PickupOptions = {},
  ) {
    const art = ALL_ART[ITEM_SPRITE[item]];
    const w = art.rows[0].length;
    const h = art.rows.length;
    super(cx - w / 2, cy - h / 2);
    this.hitbox = { ox: 0, oy: 0, w, h };
    this.price = opts.price;
    this.flag = opts.flag;
    this.lifetime = opts.lifetime;
    this.layer = 0;
  }

  static dropped(item: ItemKind, cx: number, cy: number): Pickup {
    return new Pickup(item, cx, cy, { lifetime: DROP_LIFETIME });
  }

  /** Creates a pickup centered in the tile cell at tile coords (tx, ty). */
  static atTile(item: ItemKind, tx: number, ty: number, opts: PickupOptions = {}): Pickup {
    return new Pickup(item, tx * TILE + TILE / 2, ty * TILE + TILE / 2, opts);
  }

  /** Shop items and quest items stay put; drops fade away. */
  get isShopItem(): boolean {
    return this.price !== undefined;
  }

  override update(_world: World): void {
    this.age++;
    if (this.lifetime !== undefined && !this.carried && this.age >= this.lifetime) this.dead = true;
  }

  draw(r: Renderer): void {
    const blinking = this.lifetime !== undefined && this.lifetime - this.age < 120;
    if (blinking && this.age % 4 < 2) return;
    let sprite = ITEM_SPRITE[this.item];
    if (this.item === "rupee" && this.age % 16 < 8) sprite = "rupee_flash";
    if (this.item === "triforce" && this.age % 32 < 6) sprite = "triforce_flash";
    r.sprite(sprite, this.x, this.y);
    if (this.price !== undefined) {
      const label = String(this.price);
      r.text(label, this.cx - textWidth(label) / 2, this.y + this.hitbox.h + 6);
    }
  }
}

/** A treasure chest. Touching it opens it and hands over the item inside. */
export class Chest extends Entity {
  constructor(
    readonly item: ItemKind,
    readonly flag: string,
    tx: number,
    ty: number,
  ) {
    super(tx * TILE, ty * TILE);
    this.hitbox = { ox: 1, oy: 2, w: 14, h: 12 };
    this.layer = 0;
  }

  draw(r: Renderer): void {
    r.sprite("chest", this.x, this.y);
  }
}
