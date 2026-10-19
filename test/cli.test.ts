import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Cli } from "../src/cli/Cli.js";

test("nested shapes move, undo, redo and SVG round trip", () => {
  const cli = new Cli();
  const dir = mkdtempSync(join(tmpdir(), "svg-lab-"));
  const path = join(dir, "flow.svg");
  const commands = [
    "init 800 600",
    "create g flow",
    "create g node in flow",
    "create rect r 10 20 100 50 red in node",
    'create text label 15 35 "Hello & <world>" in node',
    "move node 5 10"
  ];
  for (const command of commands) assert.doesNotMatch(cli.executeLine(command).join(" "), /^error:/);
  assert.match(cli.executeLine("tree")[0], /rect#r x=15 y=30/);
  assert.match(cli.executeLine("undo")[0], /undid move/);
  assert.match(cli.executeLine("tree")[0], /rect#r x=10 y=20/);
  assert.match(cli.executeLine("redo")[0], /redid move/);
  assert.match(cli.executeLine("tree")[0], /rect#r x=15 y=30/);
  assert.match(cli.executeLine(`save ${path}`)[0], /saved to/);
  assert.match(readFileSync(path, "utf8"), /Hello &amp; &lt;world&gt;/);
  assert.equal(cli.executeLine("undo")[0], "error: undo not allowed after io command");
  assert.match(cli.executeLine(`read ${path}`)[0], /read /);
  assert.match(cli.executeLine("tree")[0], /rect#r x=15 y=30/);
});

test("failed commands leave state and redo intact; fresh edit clears redo", () => {
  const cli = new Cli();
  for (const command of ["init", "create rect r 1 2 10 20", "move r 5 0", "undo"]) cli.executeLine(command);
  const before = cli.executeLine("tree")[0];
  assert.equal(cli.executeLine("scale r 0")[0], "error: scale factor must be positive");
  assert.equal(cli.executeLine("group bad r missing")[0], "error: no such shape: missing");
  assert.equal(cli.executeLine("tree")[0], before);
  assert.match(cli.executeLine("redo")[0], /redid move/);
  cli.executeLine("undo");
  cli.executeLine("set r fill blue");
  assert.equal(cli.executeLine("redo")[0], "error: nothing to redo");
});

test("group and ungroup preserve order and are single undo units", () => {
  const cli = new Cli();
  for (const command of ["init", "create g outer", "create rect a 0 0 1 1 in outer", "create rect b 1 0 1 1 in outer", "create rect c 2 0 1 1 in outer"]) cli.executeLine(command);
  cli.executeLine("group sub a b");
  assert.match(cli.executeLine("tree")[0], /g#sub[\s\S]*rect#a[\s\S]*rect#b[\s\S]*rect#c/);
  cli.executeLine("undo");
  assert.doesNotMatch(cli.executeLine("tree")[0], /g#sub/);
  cli.executeLine("redo");
  cli.executeLine("ungroup sub");
  assert.doesNotMatch(cli.executeLine("tree")[0], /g#sub/);
  assert.match(cli.executeLine("tree")[0], /rect#a[\s\S]*rect#b[\s\S]*rect#c/);
  assert.equal(cli.executeLine("ungroup outer")[0], "error: cannot ungroup top-level container: outer");
});

test("read assigns missing id, rejects duplicates atomically", () => {
  const cli = new Cli();
  const dir = mkdtempSync(join(tmpdir(), "svg-lab-"));
  const unnamed = join(dir, "unnamed.svg");
  const duplicate = join(dir, "duplicate.svg");
  writeFileSync(unnamed, '<svg width="10" height="20"><rect width="3" height="4"/><rect id="rect1" width="1" height="2"/></svg>');
  writeFileSync(duplicate, '<svg width="10" height="20"><rect id="x"/><circle id="x"/></svg>');
  const feedback = cli.executeLine(`read ${unnamed}`);
  assert.match(feedback[0], /warning: assigned id rect2/);
  assert.match(cli.executeLine("tree")[0], /rect#rect2/);
  const before = cli.executeLine("tree")[0];
  assert.equal(cli.executeLine(`read ${duplicate}`)[0], "error: id already exists: x");
  assert.equal(cli.executeLine("tree")[0], before);
});

test("all six shape types, numeric validation, cycle protection and unsupported box", () => {
  const cli = new Cli();
  for (const command of [
    "init 400 200", "create g g1", "create rect r 1 2 3 4 in g1",
    "create circle c 1 2 3", "create ellipse e 1 2 3 4",
    "create line l 1 2 3 4 black", 'create text t 1 2 "hello"'
  ]) assert.doesNotMatch(cli.executeLine(command).join(" "), /^error:/);
  assert.equal(cli.executeLine("create box b 0 0 3 4 title")[0], "error: unknown shape type: box (is the plugin loaded?)");
  assert.equal(cli.executeLine("addto g1 g1")[0], "error: cannot group a container into its own descendant: g1");
  assert.equal(cli.executeLine("set r width -1")[0], "error: attribute must be non-negative: width");
  assert.equal(cli.executeLine("set r foo bar")[0], "error: unknown attribute: foo");
  assert.equal(cli.executeLine("create rect r 1 2 3 4")[0], "error: id already exists: r");
  assert.equal(cli.executeLine("tree")[0].match(/rect#r/g)?.length, 1);
});
