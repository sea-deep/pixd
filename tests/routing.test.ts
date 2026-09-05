import { beforeAll, describe, expect, it } from "vitest";
import { client } from "../index.js";

beforeAll(async () => {
  await import("../src/utilities/eventHandler.js");
  await import("../src/utilities/prefixCommandHandler.js");
  await import("../src/utilities/slashCommandHandler.js");
  await import("../src/utilities/buttonHandler.js");
  await import("../src/utilities/selectMenuHandler.js");
  await import("../src/utilities/modalHandler.js");
  await import("../src/utilities/hybridCommandHandler.js");
  await import("../src/utilities/contextMenuHandler.js");
}, 20_000);

describe("template routing", () => {
  it("registers every PixD route", () => {
    expect(client.prefixCommands.size).toBeGreaterThanOrEqual(47);
    expect(client.slashCommands.size).toBeGreaterThanOrEqual(17);
    expect(client.slashCommandsArray.length).toBeGreaterThanOrEqual(19);
    expect(client.buttons.size).toBe(30);
    expect(client.modals.size).toBe(2);
    expect(client.stringSelectMenus.size).toBe(5);
    expect(client.messageContextMenus.size).toBe(2);
  });
});
