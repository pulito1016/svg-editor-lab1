import { Shape } from "./Shape.js";

export class Group extends Shape {
  readonly type = "g";
  private readonly items: Shape[] = [];
  constructor(id: string) { super(id); }
  get children(): readonly Shape[] { return this.items; }
  protected geometryKeys(): string[] { return []; }
  append(child: Shape): void { this.insert(this.items.length, child); }
  insert(index: number, child: Shape): void {
    if (child === this || this.isDescendantOf(child)) throw new Error(`cannot group a container into its own descendant: ${child.id}`);
    if (child.parent) child.parent.remove(child);
    this.items.splice(index, 0, child);
    child.setParent(this);
  }
  remove(child: Shape): void {
    const index = this.items.indexOf(child);
    if (index < 0) throw new Error(`no such shape: ${child.id}`);
    this.items.splice(index, 1);
    child.setParent(null);
  }
  indexOf(child: Shape): number { return this.items.indexOf(child); }
  isDescendantOf(other: Shape): boolean {
    let current: Group | null = this.parent;
    while (current) { if (current === other) return true; current = current.parent; }
    return false;
  }
  move(dx: number, dy: number): void { for (const child of this.items) child.move(dx, dy); }
  scale(factor: number): void { for (const child of this.items) child.scale(factor); }
  clone(): Group {
    const result = new Group(this.id);
    this.copyValues(result);
    for (const child of this.items) result.append(child.clone());
    return result;
  }
  summary(): string { return `g#${this.id}${this.style() ? " " + this.style() : ""}`; }
}
