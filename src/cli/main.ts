import { createInterface } from "node:readline";
import { Cli } from "./Cli.js";

const cli = new Cli();
const terminal = Boolean(process.stdin.isTTY);
process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
const input = createInterface({ input: process.stdin, output: process.stdout, terminal });
if (terminal) input.setPrompt("svg> ");
if (terminal) input.prompt();
input.on("line", line => {
  for (const message of cli.executeLine(line)) process.stdout.write(message + "\n");
  if (terminal) input.prompt();
});
