export abstract class Shape {
  private parentShape: Group | null = null;
  protected readonly values = new Map<string, string>();
  abstract readonly type: string;

  protected constructor(readonly id: string) {
    if (!id || /\s/.test(id)) throw new Error("invalid id");
  }

  get parent(): Group | null { return this.parentShape; }
  setParent(parent: Group | null): void { this.parentShape = parent; }
  get(attr: string): string | undefined { return this.values.get(attr); }
  attributes(): ReadonlyMap<string, string> { return this.values; }

  set(attr: string, value: string): void {
    if (!["fill", "stroke", "stroke-width", ...this.geometryKeys()].includes(attr)) {
      throw new Error(`unknown attribute: ${attr}`);
    }
    if (this.geometryKeys().includes(attr) || attr === "stroke-width") {
      const n = Number(value);
      if (!Number.isFinite(n) || value.trim() === "") throw new Error(`invalid number: ${value}`);
      if (["width", "height", "r", "rx", "ry", "stroke-width"].includes(attr) && n < 0) {
        throw new Error(`attribute must be non-negative: ${attr}`);
      }
      value = String(n);
    }
    this.values.set(attr, value);
  }

  protected abstract geometryKeys(): string[];
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract summary(): string;

  protected shift(key: string, amount: number): void {
    this.values.set(key, String(Number(this.values.get(key) ?? 0) + amount));
  }
  protected multiply(keys: string[], factor: number): void {
    for (const key of keys) this.values.set(key, String(Number(this.values.get(key) ?? 0) * factor));
  }
  protected copyValues(to: Shape): void {
    for (const [key, value] of this.values) to.values.set(key, value);
  }
  protected fields(keys: string[]): string {
    return keys.map(k => `${k}=${this.get(k) ?? ""}`).join(" ");
  }
  protected style(): string {
    return ["fill", "stroke", "stroke-width"].filter(k => this.get(k) !== undefined)
      .map(k => `${k}=${this.get(k)}`).join(" ");
  }
}

import type { Group } from "./Group.js";
