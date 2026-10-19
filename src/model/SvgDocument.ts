import { Shape } from "./Shape.js";
import { Group } from "./Group.js";

export class SvgDocument {
  readonly root = new Group("__root__");
  constructor(private canvasWidth: number, private canvasHeight: number) {
    this.resize(canvasWidth, canvasHeight);
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("canvas dimensions must be positive");
    }
    this.canvasWidth = width; this.canvasHeight = height;
  }
  clone(): SvgDocument {
    const result = new SvgDocument(this.width, this.height);
    for (const child of this.root.children) result.root.append(child.clone());
    return result;
  }
  allShapes(): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      if (shape instanceof Group) for (const child of shape.children) visit(child);
    };
    for (const child of this.root.children) visit(child);
    return result;
  }
  find(id: string): Shape | undefined { return this.allShapes().find(s => s.id === id); }
  require(id: string): Shape {
    const found = this.find(id);
    if (!found) throw new Error(`no such shape: ${id}`);
    return found;
  }
  container(id: string): Group {
    const found = this.find(id);
    if (!found) throw new Error(`no such container: ${id}`);
    if (!(found instanceof Group)) throw new Error(`not a container: ${id}`);
    return found;
  }
  create(shape: Shape, parentId?: string): void {
    if (this.find(shape.id)) throw new Error(`id already exists: ${shape.id}`);
    const parent = parentId ? this.container(parentId) : this.root;
    parent.append(shape);
  }
  delete(id: string): string {
    const shape = this.require(id);
    shape.parent!.remove(shape);
    return `${shape.type}#${id} deleted`;
  }
  move(id: string, dx: number, dy: number): string {
    const shape = this.require(id);
    shape.move(dx, dy);
    return shape instanceof Group
      ? `g#${id} moved by (${dx},${dy})`
      : `${shape.type}#${id} moved`;
  }
  scale(id: string, factor: number): string {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
    const shape = this.require(id);
    shape.scale(factor);
    return `${shape.type}#${id} scaled by ${factor}`;
  }
  set(id: string, attr: string, value: string): string {
    const shape = this.require(id);
    shape.set(attr, value);
    return `${shape.type}#${id} updated: ${attr}="${value}"`;
  }
  group(id: string, ids: string[]): string {
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
    if (ids.length < 1 || new Set(ids).size !== ids.length) throw new Error("group requires distinct shapes");
    const shapes = ids.map(item => this.require(item));
    for (const ancestor of shapes) {
      if (ancestor instanceof Group && shapes.some(s => s !== ancestor && this.isWithin(s, ancestor))) {
        throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
      }
    }
    const firstParent = shapes[0].parent!;
    const position = firstParent.indexOf(shapes[0]);
    const ordered = this.allShapes().filter(shape => shapes.includes(shape));
    const group = new Group(id);
    firstParent.insert(position, group);
    for (const shape of ordered) group.append(shape);
    return `g#${id} created with ${ordered.length} children`;
  }
  ungroup(id: string): string {
    const shape = this.require(id);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    const parent = shape.parent!;
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.indexOf(shape);
    const children = [...shape.children];
    for (let i = 0; i < children.length; i++) parent.insert(index + i, children[i]);
    parent.remove(shape);
    return `g#${id} ungrouped`;
  }
  addto(groupId: string, id: string): string {
    const target = this.container(groupId);
    const shape = this.require(id);
    target.append(shape);
    return `${shape.type}#${id} added to g#${groupId}`;
  }
  reorder(id: string, front: boolean): string {
    const shape = this.require(id);
    const parent = shape.parent!;
    parent.insert(front ? parent.children.length : 0, shape);
    return `${shape.type}#${id} moved to ${front ? "front" : "back"}`;
  }
  show(id: string): string {
    const shape = this.require(id);
    const parent = shape.parent === this.root ? "svg" : `g#${shape.parent!.id}`;
    const attrs = [...shape.attributes()].map(([k, v]) => `${k}=${v}`);
    if (shape.type === "text") attrs.push(`text="${(shape as import("./Text.js").Text).text}"`);
    return `${shape.type}#${id}  parent=${parent}\n  ${attrs.join(" ")}`;
  }
  tree(id?: string): string {
    const lines: string[] = [];
    const render = (shape: Shape, prefix: string, last: boolean): void => {
      lines.push(prefix + (last ? "└── " : "├── ") + shape.summary());
      if (shape instanceof Group) {
        const next = prefix + (last ? "    " : "│   ");
        shape.children.forEach((child, i) => render(child, next, i === shape.children.length - 1));
      }
    };
    if (id) {
      const shape = this.require(id);
      lines.push(shape.summary());
      if (shape instanceof Group) shape.children.forEach((child, i) => render(child, "", i === shape.children.length - 1));
    } else {
      lines.push(`svg (${this.width}x${this.height})`);
      this.root.children.forEach((child, i) => render(child, "", i === this.root.children.length - 1));
    }
    return lines.join("\n");
  }
  private isWithin(shape: Shape, ancestor: Group): boolean {
    let parent = shape.parent;
    while (parent) { if (parent === ancestor) return true; parent = parent.parent; }
    return false;
  }
}
