import { Shape } from "./Shape.js";

export class Rect extends Shape {
  readonly type = "rect";
  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id);
    this.set("x", String(x)); this.set("y", String(y));
    this.set("width", String(width)); this.set("height", String(height));
    if (fill !== undefined) this.set("fill", fill);
  }
  protected geometryKeys(): string[] { return ["x", "y", "width", "height"]; }
  move(dx: number, dy: number): void { this.shift("x", dx); this.shift("y", dy); }
  scale(factor: number): void { this.multiply(this.geometryKeys(), factor); }
  clone(): Rect { const r = new Rect(this.id, 0, 0, 0, 0); this.copyValues(r); return r; }
  summary(): string {
    return `rect#${this.id} x=${this.get("x")} y=${this.get("y")} w=${this.get("width")} h=${this.get("height")}${this.style() ? " " + this.style() : ""}`;
  }
}
