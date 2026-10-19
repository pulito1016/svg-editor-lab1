import { Shape } from "./Shape.js";

export class Circle extends Shape {
  readonly type = "circle";
  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id); this.set("cx", String(cx)); this.set("cy", String(cy)); this.set("r", String(r));
    if (fill !== undefined) this.set("fill", fill);
  }
  protected geometryKeys(): string[] { return ["cx", "cy", "r"]; }
  move(dx: number, dy: number): void { this.shift("cx", dx); this.shift("cy", dy); }
  scale(factor: number): void { this.multiply(this.geometryKeys(), factor); }
  clone(): Circle { const c = new Circle(this.id, 0, 0, 0); this.copyValues(c); return c; }
  summary(): string { return `circle#${this.id} ${this.fields(this.geometryKeys())}${this.style() ? " " + this.style() : ""}`; }
}
