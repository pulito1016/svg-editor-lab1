import { readFileSync, writeFileSync } from "node:fs";
import { DocumentSession } from "../session/DocumentSession.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgCodec } from "../io/SvgCodec.js";
import { EditCommand } from "../commands/EditCommand.js";
import { Lexer } from "./Lexer.js";

export class Cli {
  private readonly session = new DocumentSession();
  private readonly factory = new ShapeFactory();
  private readonly codec = new SvgCodec();
  private readonly lexer = new Lexer();
  private readonly handlers = new Map<string, (args: string[]) => string[]>();
  constructor() {
    this.register("help", args => {
      this.arity(args, 0, 0);
      return [`init [w] [h] | read <file.svg> | save [file.svg] | canvas [w] [h]
create <type> <id> [params] [in <containerId>] | delete <id> | move <id> <dx> <dy>
scale <id> <factor> | set <id> <attr> <value> | group <newGid> <id1> <id2>...
ungroup <gid> | addto <gid> <id> | front <id> | back <id>
tree [id] | show <id> | undo | redo | help`];
    });
    this.register("init", args => {
      this.arity(args, 0, 2);
      if (args.length === 1) throw new Error("init requires both width and height");
      const width = args.length ? this.number(args[0]) : 800;
      const height = args.length ? this.number(args[1]) : 600;
      this.session.init(width, height);
      return [`canvas ${width}x${height} created`];
    });
    this.register("read", args => {
      this.arity(args, 1, 1);
      let xml: string;
      try { xml = readFileSync(args[0], "utf8"); }
      catch { throw new Error(`cannot read file: ${args[0]}`); }
      const parsed = this.codec.read(xml);
      this.session.load(parsed.document, args[0]);
      return [...parsed.warnings, `read ${args[0]} (${parsed.document.allShapes().length} elements)`];
    });
    this.register("save", args => {
      this.arity(args, 0, 1);
      const doc = this.session.document;
      const path = args[0] ?? this.session.filePath;
      if (!path) throw new Error("no file path. use 'save <file.svg>'");
      try { writeFileSync(path, this.codec.write(doc), "utf8"); }
      catch { throw new Error(`cannot write file: ${path}`); }
      this.session.saved(path);
      return [`saved to ${path} (${doc.allShapes().length} elements)`];
    });
    this.register("canvas", args => {
      this.arity(args, 0, 2);
      const doc = this.session.document;
      if (args.length === 0) return [`canvas ${doc.width}x${doc.height}`];
      if (args.length !== 2) throw new Error("canvas requires both width and height");
      const width = this.number(args[0]), height = this.number(args[1]);
      this.session.resize(width, height);
      return [`canvas resized to ${width}x${height}`];
    });
    this.register("create", args => {
      if (args.length < 2) throw new Error("create requires type and id");
      const [type, id, ...rest] = args;
      let parentId: string | undefined;
      if (rest.length >= 2 && rest[rest.length - 2] === "in") {
        parentId = rest.pop();
        rest.pop();
      }
      const shape = this.factory.create(type, id, rest);
      return [this.edit("create", doc => {
        doc.create(shape, parentId);
        return `${type}#${id} created${parentId ? ` in g#${parentId}` : ""}`;
      })];
    });
    this.register("delete", args => { this.arity(args, 1, 1); return [this.edit("delete", doc => doc.delete(args[0]))]; });
    this.register("move", args => {
      this.arity(args, 3, 3);
      const dx = this.number(args[1]), dy = this.number(args[2]);
      return [this.edit("move", doc => doc.move(args[0], dx, dy))];
    });
    this.register("scale", args => {
      this.arity(args, 2, 2);
      const factor = this.number(args[1]);
      return [this.edit("scale", doc => doc.scale(args[0], factor))];
    });
    this.register("set", args => {
      this.arity(args, 3, 3);
      return [this.edit("set", doc => doc.set(args[0], args[1], args[2]))];
    });
    this.register("group", args => {
      if (args.length < 3) throw new Error("group requires a new id and at least two shapes");
      return [this.edit("group", doc => doc.group(args[0], args.slice(1)))];
    });
    this.register("ungroup", args => { this.arity(args, 1, 1); return [this.edit("ungroup", doc => doc.ungroup(args[0]))]; });
    this.register("addto", args => { this.arity(args, 2, 2); return [this.edit("addto", doc => doc.addto(args[0], args[1]))]; });
    this.register("front", args => { this.arity(args, 1, 1); return [this.edit("front", doc => doc.reorder(args[0], true))]; });
    this.register("back", args => { this.arity(args, 1, 1); return [this.edit("back", doc => doc.reorder(args[0], false))]; });
    this.register("tree", args => { this.arity(args, 0, 1); return [this.session.document.tree(args[0])]; });
    this.register("show", args => { this.arity(args, 1, 1); return [this.session.document.show(args[0])]; });
    this.register("undo", args => {
      this.arity(args, 0, 0);
      this.session.document;
      return [this.session.history.undo(this.session)];
    });
    this.register("redo", args => {
      this.arity(args, 0, 0);
      this.session.document;
      return [this.session.history.redo(this.session)];
    });
  }
  executeLine(line: string): string[] {
    try {
      if (!line.trim() || line.trimStart().startsWith("#")) return [];
      const [name, ...args] = this.lexer.tokenize(line);
      if (!name) return [];
      const handler = this.handlers.get(name);
      if (!handler) throw new Error(`unknown command: ${name}`);
      if (!["help", "init", "read"].includes(name) && !this.session.hasDocument) {
        throw new Error("no document. use 'init' or 'read' first");
      }
      return handler(args);
    } catch (error) {
      return [`error: ${error instanceof Error ? error.message : String(error)}`];
    }
  }
  private register(name: string, handler: (args: string[]) => string[]): void { this.handlers.set(name, handler); }
  private edit(name: string, operation: ConstructorParameters<typeof EditCommand>[1]): string {
    return this.session.history.run(new EditCommand(name, operation), this.session);
  }
  private arity(args: string[], min: number, max: number): void {
    if (args.length < min || args.length > max) throw new Error("invalid number of arguments");
  }
  private number(raw: string): number {
    if (!raw || !Number.isFinite(Number(raw))) throw new Error(`invalid number: ${raw}`);
    return Number(raw);
  }
}
