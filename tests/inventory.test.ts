import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

async function modules(pattern: string) {
  const files = (await glob(pattern, { absolute: true })).sort();
  return Promise.all(files.map(async (file) => ({ file, value: (await import(pathToFileURL(file).href)).default })));
}
function unique(items: Array<{ key: string; file: string }>): void {
  const seen = new Map<string, string>();
  for (const item of items) {
    expect(item.key, `missing route in ${item.file}`).toBeTruthy();
    expect(seen.get(item.key), `${item.key} duplicated by ${item.file}`).toBeUndefined();
    seen.set(item.key, item.file);
  }
}

describe("PixD feature inventory", () => {
  it("keeps equivalent prefix/slash routes in the hybrid registry", async () => {
    const prefix = await modules("src/PrefixCommands/**/*.ts");
    expect(prefix).toHaveLength(0);
    const slash = await modules("src/Interactions/SlashCommands/**/*.ts");
    const standalonePrefixNames = new Set(prefix.map(({ value }) => value.name));
    const standaloneSlashNames = slash
      .filter(({ value }) => !value.subCommand)
      .map(({ value }) => value.data.name)
      .filter((name) => standalonePrefixNames.has(name));
    expect(standaloneSlashNames).toEqual([]);

    const hybrid = await modules("src/HybridCommands/**/*.ts");
    expect(hybrid).toHaveLength(59);
    const hybridNames = new Set(hybrid.map(({ value }) => value.name));
    for (const name of ["actually", "contact", "donate", "genesis", "genetics", "gpt", "help", "img", "ping", "piracy", "removeupload", "screenshot", "ud", "upload", "volume", "ytsummarize"]) {
      expect(hybridNames.has(name), `${name} was not consolidated`).toBe(true);
    }
  });
  it("loads every prefix and hybrid command with unique routes", async () => {
    const prefix = await modules("src/PrefixCommands/**/*.ts");
    const hybrid = await modules("src/HybridCommands/**/*.ts");
    unique([...prefix, ...hybrid].flatMap(({ file, value }) => [
      { key: value.name, file }, ...(value.aliases ?? []).filter(Boolean).map((key: string) => ({ key, file })),
    ]));
  });
  it("loads every application command with unique names", async () => {
    const slash = await modules("src/Interactions/SlashCommands/**/*.ts");
    const hybrid = await modules("src/HybridCommands/**/*.ts");
    const contexts = await modules("src/Interactions/*ContextMenus/**/*.ts");
    unique([...slash.filter(({ value }) => !value.subCommand), ...hybrid.filter(({ value }) => !value.subCommand), ...contexts]
      .map(({ file, value }) => ({ key: value.data.name, file })));
    unique([...slash, ...hybrid].filter(({ value }) => value.subCommand)
      .map(({ file, value }) => ({ key: value.subCommand, file })));
  });
  it("maps every subcommand handler to a declared parent option", async () => {
    const slash = await modules("src/Interactions/SlashCommands/**/*.ts");
    const hybrid = await modules("src/HybridCommands/**/*.ts");
    const commands = [...slash, ...hybrid];
    const parents = new Map(commands.filter(({ value }) => !value.subCommand).map(({ value }) => [value.data.name, value.data]));
    const handlers = new Set(commands.map(({ value }) => value.subCommand).filter(Boolean));
    for (const [name, parent] of parents) {
      for (const option of parent.options ?? []) {
        if (option.type === 1) expect(handlers.has(`${name} ${option.name}`), `missing handler: ${name} ${option.name}`).toBe(true);
      }
    }
    for (const { file, value } of commands.filter(({ value }) => value.subCommand)) {
      const [parentName, ...route] = value.subCommand.split(" ");
      let options = parents.get(parentName)?.options ?? [];
      for (const segment of route) {
        const option = options.find((candidate: any) => candidate.name === segment);
        expect(option, `undeclared subcommand route '${value.subCommand}' in ${file}`).toBeTruthy();
        options = option?.options ?? [];
      }
    }
  });
  it("loads every component with unique IDs", async () => {
    const components = await modules("src/Interactions/{Buttons,Modals,*Select}/**/*.ts");
    unique(components.map(({ file, value }) => ({ key: value.customId, file })));
  });
});
