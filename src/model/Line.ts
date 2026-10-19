import { Shape } from "./Shape.js";

export class Line extends Shape {
  readonly type = "line";
  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id); this.set("x1", String(x1)); this.set("y1", String(y1));
    this.set("x2", String(x2)); this.set("y2", String(y2));
    if (stroke !== undefined) this.set("stroke", stroke);
  }
  protected geometryKeys(): string[] { return ["x1", "y1", "x2", "y2"]; }
  move(dx: number, dy: number): void {
    this.shift("x1", dx); this.shift("y1", dy); this.shift("x2", dx); this.shift("y2", dy);
  }
  scale(factor: number): void { this.multiply(this.geometryKeys(), factor); }
  clone(): Line { const l = new Line(this.id, 0, 0, 0, 0); this.copyValues(l); return l; }
  summary(): string { return `line#${this.id} (${this.get("x1")},${this.get("y1")}) -> (${this.get("x2")},${this.get("y2")})${this.style() ? " " + this.style() : ""}`; }
}
