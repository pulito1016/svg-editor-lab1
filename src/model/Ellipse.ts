import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  readonly type = "ellipse";
  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id); this.set("cx", String(cx)); this.set("cy", String(cy));
    this.set("rx", String(rx)); this.set("ry", String(ry));
    if (fill !== undefined) this.set("fill", fill);
  }
  protected geometryKeys(): string[] { return ["cx", "cy", "rx", "ry"]; }
  move(dx: number, dy: number): void { this.shift("cx", dx); this.shift("cy", dy); }
  scale(factor: number): void { this.multiply(this.geometryKeys(), factor); }
  clone(): Ellipse { const e = new Ellipse(this.id, 0, 0, 0, 0); this.copyValues(e); return e; }
  summary(): string { return `ellipse#${this.id} ${this.fields(this.geometryKeys())}${this.style() ? " " + this.style() : ""}`; }
}
