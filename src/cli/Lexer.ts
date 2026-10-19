export class Lexer {
  tokenize(line: string): string[] {
    const tokens: string[] = [];
    let token = "";
    let quoted = false;
    let active = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        quoted = !quoted;
        active = true;
      } else if (!quoted && /\s/.test(char)) {
        if (active) { tokens.push(token); token = ""; active = false; }
      } else if (char === "\\" && quoted && i + 1 < line.length && ['"', "\\"].includes(line[i + 1])) {
        token += line[++i];
        active = true;
      } else {
        token += char;
        active = true;
      }
    }
    if (quoted) throw new Error("unclosed quote");
    if (active) tokens.push(token);
    return tokens;
  }
}
