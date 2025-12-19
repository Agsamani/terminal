export type TerminalCommandCtx = {
  print: (line?: string) => void;
  clear: () => void;
  setPrompt: (p: string) => void;
  actions: {
    setTheme?: (t: { fg?: string; bg?: string }) => void;
  };
};

export type TerminalCommand = (
  args: string[],
  ctx: TerminalCommandCtx,
) => void | Promise<void>;

export type TerminalEngineOptions = {
  initialPrompt?: string;
  maxBufferLines?: number;
  commands?: Record<string, TerminalCommand>;
  actions?: TerminalCommandCtx["actions"];
};

export class TerminalEngine {
  private buffer: string[] = [];
  private prompt: string;
  private input = "";
  private cursor = 0;

  private history: string[] = [];
  private historyIndex: number | null = null;

  private maxBufferLines: number;
  private commands: Record<string, TerminalCommand>;

  private actions: TerminalCommandCtx["actions"];

  constructor(opts: TerminalEngineOptions = {}) {
    this.prompt = opts.initialPrompt ?? ">";
    this.maxBufferLines = opts.maxBufferLines ?? 200;
    this.commands = opts.commands ?? {};

    this.actions = opts.actions ?? {};
  }

  getPrompt() {
    return this.prompt;
  }

  getInput() {
    return this.input;
  }

  getCursor() {
    return this.cursor;
  }

  getBuffer() {
    return this.buffer;
  }

  getTextForRender(showCursor: boolean) {
    // Render buffer + current prompt line
    const left = this.input.slice(0, this.cursor);
    const right = this.input.slice(this.cursor);
    const cursorChar = showCursor ? "█" : " ";
    const line = `${this.prompt} ${left}${cursorChar}${right}`;
    return [...this.buffer, line].join("\n");
  }

  getLastLines(maxLines: number, showCursor: boolean) {
    const left = this.input.slice(0, this.cursor);
    const right = this.input.slice(this.cursor);
    const cursorChar = showCursor ? "█" : " ";
    const promptLine = `${this.prompt} ${left}${cursorChar}${right}`;

    const all = [...this.buffer, promptLine];
    return all.slice(Math.max(0, all.length - maxLines));
  }

  print(line = "") {
    this.buffer.push(line);
    if (this.buffer.length > this.maxBufferLines) {
      this.buffer.splice(0, this.buffer.length - this.maxBufferLines);
    }
  }

  clear() {
    this.buffer = [];
  }

  setPrompt(p: string) {
    this.prompt = p;
  }

  setCommands(cmds: Record<string, TerminalCommand>) {
    this.commands = cmds;
  }

  private commitInputToHistory(s: string) {
    const trimmed = s.trim();
    if (!trimmed) return;
    // avoid consecutive duplicates
    if (this.history[this.history.length - 1] !== trimmed) {
      this.history.push(trimmed);
    }
    this.historyIndex = null;
  }

  private loadHistory(delta: -1 | 1) {
    if (this.history.length === 0) return;

    if (this.historyIndex === null) {
      this.historyIndex = this.history.length;
    }

    const next = this.historyIndex + delta;
    const clamped = Math.max(0, Math.min(this.history.length, next));
    this.historyIndex = clamped;

    if (this.historyIndex === this.history.length) {
      this.input = "";
      this.cursor = 0;
      return;
    }

    this.input = this.history[this.historyIndex] ?? "";
    this.cursor = this.input.length;
  }

  insertText(text: string) {
    if (!text) return;
    this.input =
      this.input.slice(0, this.cursor) + text + this.input.slice(this.cursor);
    this.cursor += text.length;
  }

  backspace() {
    if (this.cursor <= 0) return;
    this.input =
      this.input.slice(0, this.cursor - 1) + this.input.slice(this.cursor);
    this.cursor -= 1;
  }

  del() {
    if (this.cursor >= this.input.length) return;
    this.input =
      this.input.slice(0, this.cursor) + this.input.slice(this.cursor + 1);
  }

  moveCursor(delta: number) {
    this.cursor = Math.max(0, Math.min(this.input.length, this.cursor + delta));
  }

  moveCursorToStart() {
    this.cursor = 0;
  }

  moveCursorToEnd() {
    this.cursor = this.input.length;
  }

  async submit() {
    const raw = this.input;
    const line = `${this.prompt} ${raw}`;
    this.print(line);

    this.commitInputToHistory(raw);

    this.input = "";
    this.cursor = 0;

    const trimmed = raw.trim();
    if (!trimmed) return;

    const [cmd, ...args] = trimmed.split(/\s+/);

    const ctx: TerminalCommandCtx = {
      print: (l = "") => this.print(l),
      clear: () => this.clear(),
      setPrompt: (p: string) => this.setPrompt(p),
      actions: this.actions,
    };

    const fn = this.commands[cmd];
    if (!fn) {
      this.print(`command not found: ${cmd}`);
      return;
    }

    try {
      await fn(args, ctx);
    } catch (e: any) {
      this.print(`error: ${e?.message ?? String(e)}`);
    }
  }

  handleKeyDown(e: KeyboardEvent) {
    // Let browser shortcuts pass
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        void this.submit();
        return;
      case "Backspace":
        e.preventDefault();
        this.backspace();
        return;
      case "Delete":
        e.preventDefault();
        this.del();
        return;
      case "ArrowLeft":
        e.preventDefault();
        this.moveCursor(-1);
        return;
      case "ArrowRight":
        e.preventDefault();
        this.moveCursor(1);
        return;
      case "Home":
        e.preventDefault();
        this.moveCursorToStart();
        return;
      case "End":
        e.preventDefault();
        this.moveCursorToEnd();
        return;
      case "ArrowUp":
        e.preventDefault();
        this.loadHistory(-1);
        return;
      case "ArrowDown":
        e.preventDefault();
        this.loadHistory(1);
        return;
      case "Tab":
        // optional: autocomplete later
        e.preventDefault();
        return;
      default:
        // Printable characters
        if (e.key.length === 1) {
          e.preventDefault();
          this.insertText(e.key);
        }
    }
  }
}
