import type { TerminalCommand } from "./terminalEngine";

export const commands: Record<string, TerminalCommand> = {
  help: (_, { print }) => {
    print("commands:");
    print("  help");
    print("  clear");
    print("  echo <text...>");
    print("  date");
    print("  whoami");
    print("  theme <fg #xxxxxx> <bg #xxxxxx>");
    print("  dream");
    print("  about");
  },

  clear: (_, { clear }) => {
    clear();
  },

  echo: (args, { print }) => {
    print(args.join(" "));
  },

  date: (_, { print }) => {
    print(new Date().toString());
  },

  whoami: (_, { print }) => {
    print("I don't know bro");
  },

  about: (_, { print }) => {
    print("Made by Arian");
  },

  secret: (_, { print }) => {
    print("This is a secret message :3");
  },

  dream: (_, { print }) => {
    print("Do you believe in dreams?");
  },
  // async example
  sleep: async (args, { print }) => {
    const ms = Math.max(0, Number(args[0] ?? 500));
    print(`sleeping ${ms}ms...`);
    await new Promise((r) => setTimeout(r, ms));
    print("done");
  },

  theme: (args, { actions, print }) => {
    const [fg, bg] = args; // e.g. "theme #00f #000"
    actions.setTheme?.({ fg, bg });
    print(`theme set fg=${fg ?? "unchanged"} bg=${bg ?? "unchanged"}`);
  },
};
