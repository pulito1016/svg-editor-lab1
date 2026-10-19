import { DOMParser, type Element } from "@xmldom/xmldom";
import { SvgDocument } from "../model/SvgDocument.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { Shape } from "../model/Shape.js";
import { Group } from "../model/Group.js";
import { Text } from "../model/Text.js";

export class SvgCodec {
  private readonly factory = new ShapeFactory();
  private escape(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  write(doc: SvgDocument): string {
    const render = (shape: Shape, depth: number): string => {
      const pad = "  ".repeat(depth);
      const attrs = [`id="${this.escape(shape.id)}"`, ...[...shape.attributes()]
        .map(([name, value]) => `${name}="${this.escape(value)}"`)].join(" ");
      if (shape instanceof Group) {
        if (shape.children.length === 0) return `${pad}<g ${attrs}/>`;
        return `${pad}<g ${attrs}>\n${shape.children.map(c => render(c, depth + 1)).join("\n")}\n${pad}</g>`;
      }
      if (shape instanceof Text) return `${pad}<text ${attrs}>${this.escape(shape.text)}</text>`;
      return `${pad}<${shape.type} ${attrs}/>`;
    };
    const children = doc.root.children.map(c => render(c, 1));
    const root = `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}">`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n${root}${children.length ? "\n" + children.join("\n") + "\n" : "\n"}</svg>\n`;
  }
  read(xml: string): { document: SvgDocument; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("unsupported XML declaration");
    const errors: string[] = [];
    const parsed = new DOMParser({
      onError: (_level, message) => { errors.push(message); }
    }).parseFromString(xml, "image/svg+xml");
    if (errors.length) throw new Error(`invalid SVG: ${errors[0]}`);
    const root = parsed.documentElement;
    if (!root || root.tagName !== "svg") throw new Error("invalid SVG root");
    const dimension = (raw: string): number => {
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n <= 0) throw new Error(`invalid canvas dimension: ${raw}`);
      return n;
    };
    const document = new SvgDocument(dimension(root.getAttribute("width") ?? ""), dimension(root.getAttribute("height") ?? ""));
    const warnings: string[] = [];
    const reserved = new Set<string>();
    for (let node = root.getElementsByTagName("*"), i = 0; i < node.length; i++) {
      const id = node.item(i)?.getAttribute("id");
      if (id) reserved.add(id);
    }
    const seen = new Set<string>();
    const counters = new Map<string, number>();
    const visit = (element: Element, parent?: string): void => {
      const type = element.tagName;
      if (!["rect", "circle", "ellipse", "line", "text", "g"].includes(type)) {
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
      }
      let id = element.getAttribute("id");
      if (!id) {
        let n = counters.get(type) ?? 0;
        do { n++; id = `${type}${n}`; } while (reserved.has(id) || seen.has(id));
        counters.set(type, n);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      if (seen.has(id)) throw new Error(`id already exists: ${id}`);
      seen.add(id);
      const keys: Record<string, string[]> = {
        rect: ["x", "y", "width", "height"],
        circle: ["cx", "cy", "r"],
        ellipse: ["cx", "cy", "rx", "ry"],
        line: ["x1", "y1", "x2", "y2"],
        text: ["x", "y"],
        g: []
      };
      const args = keys[type].map(key => element.getAttribute(key) ?? "0");
      if (type === "text") args.push(element.textContent ?? "");
      const shape = this.factory.create(type, id, args);
      for (const attr of ["fill", "stroke", "stroke-width"]) {
        const value = element.getAttribute(attr);
        if (value !== null) shape.set(attr, value);
      }
      document.create(shape, parent);
      if (shape instanceof Group) {
        for (let child = element.firstChild; child; child = child.nextSibling) {
          if (child.nodeType === 1) visit(child as Element, id);
        }
      }
    };
    for (let child = root.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1) visit(child as Element);
    }
    return { document, warnings };
  }
}
