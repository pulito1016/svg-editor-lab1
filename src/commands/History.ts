import { EditCommand } from "./EditCommand.js";
import type { DocumentState } from "./DocumentState.js";

export class History {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private locked = false;
  clearAndLock(): void {
    this.undoStack = []; this.redoStack = []; this.locked = true;
  }
  run(command: EditCommand, session: DocumentState): string {
    const message = command.execute(session);
    this.undoStack.push(command);
    this.redoStack = [];
    this.locked = false;
    return message;
  }
  undo(session: DocumentState): string {
    if (this.locked) throw new Error("undo not allowed after io command");
    const command = this.undoStack.pop();
    if (!command) throw new Error("nothing to undo");
    command.undo(session);
    this.redoStack.push(command);
    return `undid ${command.name}`;
  }
  redo(session: DocumentState): string {
    if (this.locked) throw new Error("undo not allowed after io command");
    const command = this.redoStack.pop();
    if (!command) throw new Error("nothing to redo");
    command.redo(session);
    this.undoStack.push(command);
    return `redid ${command.name}`;
  }
}
