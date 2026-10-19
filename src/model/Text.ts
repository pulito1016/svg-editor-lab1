import { Shape } from "./Shape.js";

export class Text extends Shape {
  readonly type = "text";
  private content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super(id); this.set("x", String(x)); this.set("y", String(y)); this.content = content;
  }
  get text(): string { return this.content; }
  set(attr: string, value: string): void {
    if (attr === "text") { this.content = value; return; }
    super.set(attr, value);
  }
  protected geometryKeys(): string[] { return ["x", "y"]; }
  move(dx: number, dy: number): void { this.shift("x", dx); this.shift("y", dy); }
  scale(factor: number): void { this.multiply(this.geometryKeys(), factor); }
  clone(): Text { const t = new Text(this.id, 0, 0, this.content); this.copyValues(t); return t; }
  summary(): string { return `text#${this.id} (${this.get("x")},${this.get("y")}) "${this.content}"${this.style() ? " " + this.style() : ""}`; }
}
