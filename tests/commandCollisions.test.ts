import { describe, expect, it } from "vitest";
import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

interface CommandMetadata {
  name: string;
  aliases?: string[];
  subCommand?: string | null;
  slashRoute?: string;
  data?: { name?: string };
}

describe("command collision detector", () => {
  it("ensures no duplicate command names, aliases, or cross-command collisions exist", async () => {
    const cwd = process.cwd().replace(/\\/g, "/");
    const pattern = `${cwd}/src/HybridCommands/**/*.{ts,js}`;
    const files = await glob(pattern);

    expect(files.length).toBeGreaterThan(0);

    // Map trigger token (lowercase) -> { sourceFile, ownerCommand, type: "name" | "alias" }
    const registeredTriggers = new Map<
      string,
      { file: string; command: string; type: "name" | "alias" }
    >();
    const collisions: string[] = [];

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const mod = await import(fileUrl);
      const cmd: CommandMetadata = mod.default;

      if (!cmd || !cmd.name) continue;

      const cmdName = cmd.name.trim().toLowerCase();

      // 1. Check primary command name
      if (registeredTriggers.has(cmdName)) {
        const existing = registeredTriggers.get(cmdName)!;
        collisions.push(
          `Command name '${cmdName}' in '${file}' conflicts with ${existing.type} of '${existing.command}' in '${existing.file}'`
        );
      } else {
        registeredTriggers.set(cmdName, {
          file,
          command: cmd.name,
          type: "name",
        });
      }

      // 2. Check all aliases
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          if (!alias || typeof alias !== "string") continue;
          const cleanAlias = alias.trim().toLowerCase();

          // An alias must not equal the command's own name
          if (cleanAlias === cmdName) {
            collisions.push(
              `Command '${cmd.name}' in '${file}' has a redundant alias '${alias}' identical to its own name`
            );
            continue;
          }

          if (registeredTriggers.has(cleanAlias)) {
            const existing = registeredTriggers.get(cleanAlias)!;
            collisions.push(
              `Alias '${cleanAlias}' of command '${cmd.name}' in '${file}' conflicts with ${existing.type} of '${existing.command}' in '${existing.file}'`
            );
          } else {
            registeredTriggers.set(cleanAlias, {
              file,
              command: cmd.name,
              type: "alias",
            });
          }
        }
      }
    }

    if (collisions.length > 0) {
      throw new Error(
        `Command naming collisions detected (${collisions.length}):\n` +
          collisions.map((c, i) => `  ${i + 1}. ${c}`).join("\n")
      );
    }
  });

  it("ensures no duplicate slash command or subcommand registrations exist", async () => {
    const cwd = process.cwd().replace(/\\/g, "/");
    const hybridFiles = await glob(`${cwd}/src/HybridCommands/**/*.{ts,js}`);
    const slashFiles = await glob(`${cwd}/src/Interactions/SlashCommands/**/*.{ts,js}`);

    const registeredSlash = new Map<string, string>();
    const registeredSubcommands = new Map<string, string>();
    const collisions: string[] = [];

    // Check hybrid slash commands
    for (const file of hybridFiles.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const mod = await import(fileUrl);
      const cmd = mod.default;
      if (!cmd || !cmd.name) continue;

      if (cmd.subCommand) {
        const route = cmd.subCommand.toLowerCase();
        if (registeredSubcommands.has(route)) {
          collisions.push(`Subcommand '${route}' in '${file}' already registered by '${registeredSubcommands.get(route)}'`);
        } else {
          registeredSubcommands.set(route, file);
        }
      } else {
        const name = (cmd.data?.name || cmd.name).toLowerCase();
        if (registeredSlash.has(name)) {
          collisions.push(`Slash command '${name}' in '${file}' already registered by '${registeredSlash.get(name)}'`);
        } else {
          registeredSlash.set(name, file);
        }
      }
    }

    // Check standalone slash commands
    for (const file of slashFiles.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const mod = await import(fileUrl);
      const cmd = mod.default;
      if (!cmd) continue;

      if (cmd.subCommand) {
        const route = cmd.subCommand.toLowerCase();
        if (registeredSubcommands.has(route)) {
          collisions.push(`Subcommand '${route}' in '${file}' already registered by '${registeredSubcommands.get(route)}'`);
        } else {
          registeredSubcommands.set(route, file);
        }
      } else if (cmd.data?.name) {
        const name = cmd.data.name.toLowerCase();
        if (registeredSlash.has(name)) {
          collisions.push(`Slash command '${name}' in '${file}' already registered by '${registeredSlash.get(name)}'`);
        } else {
          registeredSlash.set(name, file);
        }
      }
    }

    if (collisions.length > 0) {
      throw new Error(
        `Slash command collisions detected (${collisions.length}):\n` +
          collisions.map((c, i) => `  ${i + 1}. ${c}`).join("\n")
      );
    }
  });
});
