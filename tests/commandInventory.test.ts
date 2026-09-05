import { pathToFileURL } from "node:url";
import { glob } from "glob";
import { describe, expect, it } from "vitest";

async function load(pattern: string): Promise<Array<{ file: string; value: any }>> {
  const files = (await glob(pattern, { cwd: process.cwd(), absolute: true })).sort();
  return Promise.all(files.map(async (file) => ({
    file,
    value: (await import(pathToFileURL(file).href)).default,
  })));
}

function expectUnique(entries: Array<{ key: string; file: string }>): void {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    expect(seen.get(entry.key), `${entry.key} is duplicated by ${entry.file}`).toBeUndefined();
    seen.set(entry.key, entry.file);
  }
}

describe("routed module inventory", () => {
  it("has unique command and alias routes", async () => {
    const prefix = await load("PrefixCommands/**/*.js");
    const hybrid = await load("HybridCommands/**/*.ts");
    const slash = await load("Interactions/SlashCommands/**/*.js");

    expectUnique([
      ...prefix.flatMap(({ file, value }) => [
        { key: value.name, file },
        ...(value.aliases ?? []).filter(Boolean).map((key: string) => ({ key, file })),
      ]),
      ...hybrid.flatMap(({ file, value }) => [
        { key: value.name, file },
        ...(value.aliases ?? []).filter(Boolean).map((key: string) => ({ key, file })),
      ]),
    ]);

    expectUnique([
      ...slash.filter(({ value }) => value.data).map(({ file, value }) => ({ key: value.data.name, file })),
      ...hybrid.map(({ file, value }) => ({ key: value.data.name, file })),
    ]);
  });

  it("has unique component routes", async () => {
    const groups = await Promise.all([
      load("Interactions/Buttons/**/*.js"),
      load("Interactions/Modals/**/*.js"),
      load("Interactions/StringSelectMenu/**/*.js"),
    ]);
    expectUnique(groups.flat().map(({ file, value }) => ({ key: value.name, file })));
  });
});
