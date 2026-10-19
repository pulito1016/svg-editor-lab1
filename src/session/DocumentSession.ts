import { SvgDocument } from "../model/SvgDocument.js";
import { History } from "../commands/History.js";

export class DocumentSession {
  private current?: SvgDocument;
  filePath?: string;
  readonly history = new History();
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  set document(value: SvgDocument) { this.current = value; }
  get hasDocument(): boolean { return this.current !== undefined; }
  init(width = 800, height = 600): void {
    this.current = new SvgDocument(width, height);
    this.filePath = undefined;
    this.history.clearAndLock();
  }
  load(document: SvgDocument, path: string): void {
    this.current = document;
    this.filePath = path;
    this.history.clearAndLock();
  }
  saved(path: string): void {
    this.filePath = path;
    this.history.clearAndLock();
  }
  resize(width: number, height: number): void {
    const working = this.document.clone();
    working.resize(width, height);
    this.current = working;
    this.history.clearAndLock();
  }
}
