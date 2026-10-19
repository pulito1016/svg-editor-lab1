import { Shape } from "./Shape.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { Text } from "./Text.js";
import { Group } from "./Group.js";

export class ShapeFactory {
  create(type: string, id: string, args: string[]): Shape {
    const numeric = (index: number): number => {
      const raw = args[index];
      if (raw === undefined || raw.trim() === "" || !Number.isFinite(Number(raw))) {
        throw new Error(`invalid number: ${raw ?? "(missing)"}`);
      }
      return Number(raw);
    };
    const arity = (min: number, max: number): void => {
      if (args.length < min || args.length > max) throw new Error(`invalid arguments for ${type}`);
    };
    switch (type) {
      case "rect": arity(4, 5); return new Rect(id, numeric(0), numeric(1), numeric(2), numeric(3), args[4]);
      case "circle": arity(3, 4); return new Circle(id, numeric(0), numeric(1), numeric(2), args[3]);
      case "ellipse": arity(4, 5); return new Ellipse(id, numeric(0), numeric(1), numeric(2), numeric(3), args[4]);
      case "line": arity(4, 5); return new Line(id, numeric(0), numeric(1), numeric(2), numeric(3), args[4]);
      case "text": arity(3, 3); numeric(0); numeric(1); return new Text(id, Number(args[0]), Number(args[1]), args[2]);
      case "g": arity(0, 0); return new Group(id);
      default: throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }
}
