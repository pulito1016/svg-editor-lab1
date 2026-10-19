import type { DocumentState } from "./DocumentState.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class EditCommand {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private result = "";
  constructor(
    readonly name: string,
    private readonly operation: (document: SvgDocument) => string
  ) {}
  execute(session: DocumentState): string {
    const original = session.document.clone();
    const working = session.document.clone();
    this.result = this.operation(working);
    this.before = original;
    this.after = working.clone();
    session.document = working;
    return this.result;
  }
  undo(session: DocumentState): void {
    if (!this.before) throw new Error("command not executed");
    session.document = this.before.clone();
  }
  redo(session: DocumentState): void {
    if (!this.after) throw new Error("command not executed");
    session.document = this.after.clone();
  }
  get message(): string { return this.result; }
}
